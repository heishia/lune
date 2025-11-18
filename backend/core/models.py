from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    marketing_agreed: Mapped[bool] = mapped_column(Boolean, default=False)

    orders: Mapped[List["Order"]] = relationship(back_populates="user")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    original_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    category: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    colors: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    sizes: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    is_new: Mapped[bool] = mapped_column(Boolean, default=False)
    is_best: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    order_items: Mapped[List["OrderItem"]] = relationship(back_populates="product")


class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    color: Mapped[str] = mapped_column(String(50), nullable=False)
    size: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    product: Mapped[Product] = relationship()
    # user 관계는 필요 시 추가


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    user_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"))
    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    total_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    discount_amount: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    shipping_fee: Mapped[int] = mapped_column(Integer, nullable=False, default=3000)
    final_amount: Mapped[int] = mapped_column(Integer, nullable=False)

    recipient_name: Mapped[str] = mapped_column(String(100), nullable=False)
    recipient_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(10), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    address_detail: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    delivery_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    payment_status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[Optional[User]] = relationship(back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    order_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    color: Mapped[str] = mapped_column(String(50), nullable=False)
    size: Mapped[str] = mapped_column(String(10), nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    order: Mapped[Order] = relationship(back_populates="items")
    product: Mapped[Product] = relationship(back_populates="order_items")


class KakaoSettings(Base):
    __tablename__ = "kakao_settings"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class InstagramSettings(Base):
    __tablename__ = "instagram_settings"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    featured_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


