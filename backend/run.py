import sys
from pathlib import Path
import uvicorn

# 프로젝트 루트를 PYTHONPATH에 추가
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))


def run_server() -> None:
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
    )


if __name__ == "__main__":
    run_server()


