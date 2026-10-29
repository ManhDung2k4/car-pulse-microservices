from sqlalchemy import Column, BigInteger, String, Text, TIMESTAMP
from sqlalchemy.sql import func
from database import Base


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    user_id = Column(BigInteger, nullable=False)

    role = Column(String(20), nullable=False)

    message = Column(Text, nullable=False)

    created_at = Column(
        TIMESTAMP,
        server_default=func.now()
    )