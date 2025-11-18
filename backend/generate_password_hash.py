"""비밀번호 해시 생성 스크립트 - DATABASE_DATA.sql에 저장"""
import sys
import os
import re

# 프로젝트 루트를 Python 경로에 추가
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# bcrypt 모듈을 임시로 제거하여 passlib이 순수 Python 구현을 사용하도록 강제
if 'bcrypt' in sys.modules:
    del sys.modules['bcrypt']

from passlib.context import CryptContext

# passlib의 순수 Python bcrypt 구현 강제 사용
pwd_context = CryptContext(
    schemes=["bcrypt"],
    bcrypt__ident="2b",
    deprecated="auto"
)

def extract_users_from_sql():
    """DATABASE_DATA.sql 파일에서 사용자 정보(이메일, 비밀번호) 추출"""
    data_sql_path = os.path.join(project_root, "database", "DATABASE_DATA.sql")
    
    if not os.path.exists(data_sql_path):
        print(f"경고: {data_sql_path} 파일을 찾을 수 없습니다.")
        return []
    
    try:
        with open(data_sql_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        users = []
        # 주석에서 이메일과 비밀번호 정보 추출
        # 패턴: -- 테스트 사용자 (email, 비밀번호: password) 또는 -- 추가 테스트 사용자 (email, 비밀번호: password)
        pattern = r"--\s*(?:테스트 사용자|추가 테스트 사용자)\s*\(([^,]+),\s*비밀번호:\s*([^)]+)\)"
        matches = re.findall(pattern, content)
        
        for email, password in matches:
            email = email.strip().strip("'\"")
            password = password.strip().strip("'\"")
            users.append({"email": email, "password": password})
        
        return users
    except Exception as e:
        print(f"에러: {data_sql_path} 파일 읽기 실패: {e}")
        return []

def update_data_sql(password_hash: str, email: str, password: str):
    """DATABASE_DATA.sql 파일의 비밀번호 해시를 업데이트"""
    data_sql_path = os.path.join(project_root, "database", "DATABASE_DATA.sql")
    
    if not os.path.exists(data_sql_path):
        print(f"경고: {data_sql_path} 파일을 찾을 수 없습니다.")
        return False
    
    try:
        with open(data_sql_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 해당 이메일이 포함된 INSERT 문 블록 찾기
        # 패턴: INSERT INTO users ... 'email' ... password_hash ... 'old_hash' ...
        # 여러 줄에 걸쳐 있을 수 있으므로 DOTALL 플래그 사용
        
        # 먼저 email이 포함된 INSERT 문 블록 찾기
        insert_pattern = rf"(INSERT INTO users[^;]*'{re.escape(email)}'[^;]*?password_hash[^;]*?)('\$2b\$[^']*')([^;]*?;)"
        
        def replace_hash(match):
            return match.group(1) + f"'{password_hash}'" + match.group(3)
        
        new_content = re.sub(insert_pattern, replace_hash, content, flags=re.DOTALL | re.IGNORECASE)
        
        # 패턴이 매치되지 않았으면 다른 방법 시도
        # password_hash 필드가 별도 라인에 있는 경우 또는 VALUES 절에서 값 순서로 찾기
        if new_content == content:
            lines = content.split('\n')
            email_line_idx = None
            hash_line_idx = None
            insert_start_idx = None
            
            # email이 포함된 라인 찾기
            for i, line in enumerate(lines):
                if f"'{email}'" in line or f'"{email}"' in line:
                    email_line_idx = i
                    # 같은 INSERT 블록의 시작점 찾기 (INSERT INTO users)
                    for j in range(i, max(i - 10, -1), -1):
                        if 'INSERT INTO users' in lines[j].upper():
                            insert_start_idx = j
                            break
                    break
            
            if email_line_idx is not None and insert_start_idx is not None:
                # INSERT 문에서 필드 순서 확인
                insert_fields_line = None
                for i in range(insert_start_idx, email_line_idx + 1):
                    if 'INSERT INTO users' in lines[i].upper() and '(' in lines[i]:
                        # 필드 목록 추출
                        insert_fields_line = i
                        break
                
                if insert_fields_line is not None:
                    # 필드 순서 파싱: INSERT INTO users (email, name, password_hash, ...)
                    fields_line = lines[insert_fields_line]
                    # VALUES 이전의 필드 목록 추출
                    if 'VALUES' in fields_line.upper():
                        fields_part = fields_line.split('VALUES')[0] if 'VALUES' in fields_line.upper() else fields_line
                    else:
                        # VALUES가 다음 라인에 있을 수 있음
                        fields_part = fields_line
                        for i in range(insert_fields_line + 1, email_line_idx + 1):
                            if 'VALUES' in lines[i].upper():
                                break
                            fields_part += ' ' + lines[i]
                    
                    # 필드 목록에서 password_hash의 위치 찾기
                    fields_match = re.search(r'\(([^)]+)\)', fields_part, re.IGNORECASE)
                    if fields_match:
                        fields = [f.strip() for f in fields_match.group(1).split(',')]
                        try:
                            password_hash_index = [f.lower() for f in fields].index('password_hash')
                        except ValueError:
                            password_hash_index = None
                        
                        if password_hash_index is not None:
                            # VALUES 절 찾기 (email 라인부터 세미콜론까지)
                            values_start_idx = None
                            values_end_idx = None
                            
                            # VALUES 키워드 찾기
                            for i in range(insert_start_idx, email_line_idx + 5):
                                if 'VALUES' in lines[i].upper():
                                    values_start_idx = i
                                    break
                            
                            # email이 포함된 라인부터 세미콜론까지
                            for i in range(email_line_idx, min(email_line_idx + 20, len(lines))):
                                if ';' in lines[i]:
                                    values_end_idx = i
                                    break
                            
                            if values_start_idx is not None and values_end_idx is not None:
                                # VALUES 절 전체 텍스트 가져오기
                                values_block = '\n'.join(lines[values_start_idx:values_end_idx + 1])
                                
                                # VALUES 절의 괄호 안 내용 추출
                                values_match = re.search(r'VALUES\s*\(([^)]+(?:\([^)]*\)[^)]*)*)\)', values_block, re.DOTALL | re.IGNORECASE)
                                if not values_match:
                                    # 여러 줄에 걸친 경우 다시 시도
                                    values_match = re.search(r'VALUES\s*\((.*?)\);', values_block, re.DOTALL | re.IGNORECASE)
                                
                                if values_match:
                                    values_text = values_match.group(1)
                                    
                                    # 쉼표로 분리하되 문자열 내부는 제외
                                    values = []
                                    current = ""
                                    in_quotes = False
                                    quote_char = None
                                    
                                    for char in values_text:
                                        if char in ("'", '"') and (not current or current[-1] != '\\'):
                                            if not in_quotes:
                                                in_quotes = True
                                                quote_char = char
                                            elif char == quote_char:
                                                in_quotes = False
                                                quote_char = None
                                        elif char == ',' and not in_quotes:
                                            values.append(current.strip())
                                            current = ""
                                            continue
                                        current += char
                                    if current.strip():
                                        values.append(current.strip())
                                    
                                    # password_hash 위치의 값 교체
                                    if password_hash_index < len(values):
                                        old_value = values[password_hash_index].strip()
                                        # '$2b$...' 형식의 값만 교체
                                        if re.match(r"'\$2b\$[^']*'", old_value):
                                            values[password_hash_index] = f"'{password_hash}'"
                                            
                                            # 원래 VALUES 라인 재구성
                                            new_values = ', '.join(values)
                                            # VALUES 절 교체
                                            new_values_block = re.sub(
                                                r'VALUES\s*\([^)]+\)',
                                                f'VALUES ({new_values})',
                                                values_block,
                                                count=1,
                                                flags=re.DOTALL | re.IGNORECASE
                                            )
                                            
                                            # 라인들 교체
                                            new_values_lines = new_values_block.split('\n')
                                            for idx, new_line in enumerate(new_values_lines):
                                                if values_start_idx + idx < len(lines):
                                                    lines[values_start_idx + idx] = new_line
                                                else:
                                                    lines.append(new_line)
                                            
                                            # 나머지 라인 제거 (필요시)
                                            if len(new_values_lines) < (values_end_idx - values_start_idx + 1):
                                                del lines[values_start_idx + len(new_values_lines):values_end_idx + 1]
                                            
                                            new_content = '\n'.join(lines)
                
                # 위 방법이 실패하면 기존 방법 시도
                if new_content == content:
                    # password_hash가 별도 라인에 있는 경우
                    for i in range(email_line_idx, min(email_line_idx + 20, len(lines))):
                        if 'password_hash' in lines[i]:
                            hash_line_idx = i
                            break
                    
                    if hash_line_idx is not None:
                        # password_hash 값 교체
                        hash_line = lines[hash_line_idx]
                        # 패턴: '$2b$...' 또는 '$2b$...' -- 주석
                        pattern = r"('\$2b\$[^']*')(\s*--.*)?"
                        new_hash_line = re.sub(pattern, f"'{password_hash}'", hash_line)
                        
                        if new_hash_line == hash_line:
                            # 다른 패턴 시도: password_hash, 뒤에 오는 값
                            pattern2 = r"(password_hash[^,]*,\s*)([^\n,]+)"
                            new_hash_line = re.sub(pattern2, rf"\1'{password_hash}'", hash_line)
                        
                        lines[hash_line_idx] = new_hash_line
                        new_content = '\n'.join(lines)
        
        if new_content == content:
            # INSERT 문이 없으면 자동으로 생성
            lines_list = content.split('\n')
            email_found_in_values = False
            insert_found = False
            comment_line_idx = None
            
            # 전체 파일에서 해당 이메일이 VALUES 절에 있는지 확인
            for i, line in enumerate(lines_list):
                # VALUES 절에 이메일이 있는지 확인
                if f"'{email}'" in line or f'"{email}"' in line:
                    email_found_in_values = True
                    # 이전 라인들에서 INSERT 문 찾기 (최대 20줄 전까지)
                    for j in range(max(0, i - 20), i + 1):
                        if 'INSERT INTO users' in lines_list[j].upper():
                            insert_found = True
                            break
                    if insert_found:
                        break
                
                # 주석에서 이메일 찾기
                if email in line and line.strip().startswith('--'):
                    comment_line_idx = i
            
            # 주석은 있지만 VALUES 절에 이메일이 없는 경우
            if comment_line_idx is not None and not email_found_in_values:
                # 주석 다음에 INSERT 문이 있는지 확인 (최대 10줄)
                for j in range(comment_line_idx + 1, min(comment_line_idx + 11, len(lines_list))):
                    if 'INSERT INTO users' in lines_list[j].upper():
                        # INSERT 문이 있지만 이메일이 없는 경우는 이미 처리됨
                        insert_found = True
                        break
            
            if not insert_found:
                # INSERT 문이 없으면 자동 생성
                if comment_line_idx is not None:
                    # 주석에서 이름 추출 시도
                    comment_line = lines_list[comment_line_idx]
                    name = "테스트 사용자"  # 기본값
                    
                    # 주석 패턴: -- 테스트 사용자 (email, 비밀번호: password)
                    # 또는 -- 추가 테스트 사용자 (email, 비밀번호: password)
                    name_match = re.search(r'--\s*(?:테스트 사용자|추가 테스트 사용자)\s*\(', comment_line)
                    if name_match:
                        # 주석에서 이름 추출 (이메일 앞의 텍스트)
                        name_pattern = r'--\s*([^(]+?)\s*\('
                        name_match2 = re.search(name_pattern, comment_line)
                        if name_match2:
                            extracted_name = name_match2.group(1).strip()
                            if extracted_name and extracted_name not in ['테스트 사용자', '추가 테스트 사용자']:
                                name = extracted_name
                    
                    # 주석 다음에 INSERT 문 추가
                    # 기본 INSERT 문 생성
                    insert_sql = f"INSERT INTO users (email, name, password_hash, phone, marketing_agreed, is_active) VALUES\n"
                    insert_sql += f"('{email}', '{name}', '{password_hash}', '01012345678', true, true);\n"
                    
                    # 주석 다음 라인에 INSERT 문 추가
                    new_lines = lines_list[:comment_line_idx + 1] + [''] + [insert_sql] + lines_list[comment_line_idx + 1:]
                    new_content = '\n'.join(new_lines)
                    
                    print(f"✓ {email}에 대한 INSERT 문을 자동으로 생성했습니다.")
                else:
                    print(f"경고: {email}에 대한 주석을 찾을 수 없습니다.")
                    return False
            else:
                print(f"경고: {email}의 password_hash 필드를 찾을 수 없습니다.")
                print(f"      INSERT 문에 password_hash 필드가 포함되어 있는지 확인하세요.")
                return False
        
        with open(data_sql_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✓ {data_sql_path} 파일이 업데이트되었습니다.")
        return True
    except Exception as e:
        print(f"에러: {data_sql_path} 파일 업데이트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # DATABASE_DATA.sql 파일에서 사용자 정보 추출
    test_users = extract_users_from_sql()
    
    if not test_users:
        print("경고: DATABASE_DATA.sql에서 사용자 정보를 찾을 수 없습니다.")
        print("주석 형식: -- 테스트 사용자 (email@example.com, 비밀번호: password123)")
        sys.exit(1)
    
    print(f"DATABASE_DATA.sql에서 {len(test_users)}명의 사용자를 찾았습니다.\n")
    print("비밀번호 해시 생성 중...\n")
    
    for user in test_users:
        try:
            password = user["password"]
            email = user["email"]
            
            hashed = pwd_context.hash(password)
            print(f"이메일: {email}")
            print(f"비밀번호: {password}")
            print(f"해시: {hashed}")
            
            # DATABASE_DATA.sql 파일 업데이트
            if update_data_sql(hashed, email, password):
                print(f"✓ {email}의 비밀번호 해시가 DATABASE_DATA.sql에 저장되었습니다.\n")
            else:
                print(f"✗ {email}의 비밀번호 해시 저장 실패\n")
                
        except Exception as e:
            print(f"에러 발생 ({user['email']}): {e}")
            import traceback
            traceback.print_exc()
            print()

