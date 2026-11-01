# ==========================================
# Homiego Backend - FastAPI + SQLite
# ==========================================

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker, relationship
from pydantic import BaseModel, EmailStr, field_validator, AliasChoices, Field
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import os

# ==========================================
# CONFIG
# ==========================================

SECRET_KEY = os.getenv("SECRET_KEY", "homiego-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

DATABASE_URL = "sqlite:///./homiego.db"

# ==========================================
# DATABASE SETUP
# ==========================================

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# ==========================================
# MODELS (Database tables)
# ==========================================

class UserModel(Base):
    __tablename__ = "users"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    email       = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role        = Column(String, default="student")   # "student" | "owner"
    created_at  = Column(DateTime, default=datetime.now)

    rooms       = relationship("RoomModel",    back_populates="owner",    cascade="all, delete-orphan")
    reviews     = relationship("ReviewModel",  back_populates="author",   cascade="all, delete-orphan")
    favorites   = relationship("FavoriteModel", back_populates="user",   cascade="all, delete-orphan")


class RoomModel(Base):
    __tablename__ = "rooms"
    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String, nullable=False)
    location     = Column(String, nullable=False)
    university   = Column(String, nullable=False)
    rent         = Column(Integer, nullable=False)
    bed          = Column(String, default="Single")      # "Single" | "Double"
    ac           = Column(String, default="Non-AC")      # "AC" | "Non-AC"
    food         = Column(String, default="No")          # "Yes" | "No"
    electricity  = Column(String, default="No")          # "Yes" | "No"
    total        = Column(Integer, default=1)
    vacant       = Column(Integer, default=1)
    contact      = Column(String, nullable=False)
    description  = Column(Text, default="")
    image        = Column(String, default="")
    owner_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at   = Column(DateTime, default=datetime.now)

    owner        = relationship("UserModel",   back_populates="rooms")
    reviews      = relationship("ReviewModel", back_populates="room",  cascade="all, delete-orphan")
    favorites    = relationship("FavoriteModel", back_populates="room", cascade="all, delete-orphan")

    @property
    def avg_rating(self) -> float:
        if not self.reviews:
            return 0.0
        return round(sum(r.rating for r in self.reviews) / len(self.reviews), 1)


class ReviewModel(Base):
    __tablename__ = "reviews"
    id         = Column(Integer, primary_key=True, index=True)
    room_id    = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating     = Column(Integer, nullable=False)   # 1-5
    message    = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    room   = relationship("RoomModel", back_populates="reviews")
    author = relationship("UserModel", back_populates="reviews")


class FavoriteModel(Base):
    __tablename__ = "favorites"
    id      = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)

    user = relationship("UserModel", back_populates="favorites")
    room = relationship("RoomModel", back_populates="favorites")


Base.metadata.create_all(bind=engine)

# ==========================================
# AUTH HELPERS
# ==========================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserModel:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def require_owner(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Only property owners can do this.")
    return current_user


def require_student(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can do this.")
    return current_user


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================

class UserRegister(BaseModel):
    name:     str
    email:    str
    password: str
    role:     str = "student"   # "student" | "owner"

    @field_validator("role")
    @classmethod
    def valid_role(cls, v):
        if v not in ("student", "owner"):
            raise ValueError("role must be 'student' or 'owner'")
        return v


class UserOut(BaseModel):
    id:    int
    name:  str
    email: str
    role:  str
    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type:   str
    user:         UserOut


class RoomCreate(BaseModel):
    title:       str
    location:    str
    university:  str
    rent:        int
    bed:         str = "Single"
    ac:          str = "Non-AC"
    food:        str = "No"
    electricity: str = "No"
    total:       int = Field(default=1, validation_alias=AliasChoices("total", "total_rooms"))
    vacant:      int = Field(default=1, validation_alias=AliasChoices("vacant", "vacant_rooms"))
    contact:     str
    description: str = ""
    image:       str = ""


class RoomUpdate(BaseModel):
    title:       Optional[str]  = None
    location:    Optional[str]  = None
    university:  Optional[str]  = None
    rent:        Optional[int]  = None
    bed:         Optional[str]  = None
    ac:          Optional[str]  = None
    food:        Optional[str]  = None
    electricity: Optional[str]  = None
    total:       Optional[int]  = None
    vacant:      Optional[int]  = None
    contact:     Optional[str]  = None
    description: Optional[str]  = None
    image:       Optional[str]  = None


class RoomOut(BaseModel):
    id:          int
    title:       str
    location:    str
    university:  str
    rent:        int
    bed:         str
    ac:          str
    food:        str
    electricity: str
    total:       int
    vacant:      int
    contact:     str
    description: str
    image:       str
    avg_rating:  float
    owner_id:    int
    model_config = {"from_attributes": True}


class ReviewCreate(BaseModel):
    room_id: int = Field(validation_alias=AliasChoices("room_id", "property_id"))
    rating:  int
    message: str

    @field_validator("rating")
    @classmethod
    def valid_rating(cls, v):
        if v < 1 or v > 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewOut(BaseModel):
    id:         int
    room_id:    int
    user_id:    int
    rating:     int
    message:    str
    author_name: str
    created_at: datetime
    model_config = {"from_attributes": True}


class FavoriteOut(BaseModel):
    id:      int
    user_id: int
    room_id: int
    model_config = {"from_attributes": True}


# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI(
    title="Homiego API",
    description="Student accommodation finder backend for Homiego",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # In production, set this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# AUTH ROUTES
# ==========================================

@app.post("/auth/register", response_model=Token, tags=["Auth"])
def register(body: UserRegister, db: Session = Depends(get_db)):
    """Register a new student or property owner."""
    if db.query(UserModel).filter(UserModel.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")
    user = UserModel(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.post("/auth/login", response_model=Token, tags=["Auth"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login with email (username field) and password."""
    user = db.query(UserModel).filter(UserModel.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.get("/auth/me", response_model=UserOut, tags=["Auth"])
def get_me(current_user: UserModel = Depends(get_current_user)):
    """Get the currently logged-in user's profile."""
    return current_user


# ==========================================
# ROOMS ROUTES
# ==========================================

@app.get("/properties", response_model=List[RoomOut], tags=["Compatibility"])
@app.get("/rooms", response_model=List[RoomOut], tags=["Rooms"])
def list_rooms(
    university: Optional[str] = None,
    location:   Optional[str] = None,
    ac:         Optional[str] = None,
    food:       Optional[str] = None,
    min_rent:   Optional[int] = None,
    max_rent:   Optional[int] = None,
    db: Session = Depends(get_db),
):
    """List all rooms with optional filters."""
    query = db.query(RoomModel)
    if university:
        query = query.filter(RoomModel.university.ilike(f"%{university}%"))
    if location:
        query = query.filter(RoomModel.location.ilike(f"%{location}%"))
    if ac:
        query = query.filter(RoomModel.ac == ac)
    if food:
        query = query.filter(RoomModel.food == food)
    if min_rent is not None:
        query = query.filter(RoomModel.rent >= min_rent)
    if max_rent is not None:
        query = query.filter(RoomModel.rent <= max_rent)
    return query.all()


@app.get("/properties/mine", response_model=List[RoomOut], tags=["Compatibility"])
def my_properties(owner: UserModel = Depends(require_owner), db: Session = Depends(get_db)):
    return db.query(RoomModel).filter(RoomModel.owner_id == owner.id).order_by(RoomModel.created_at.desc()).all()


@app.get("/properties/{room_id}", response_model=RoomOut, tags=["Compatibility"])
@app.get("/rooms/{room_id}", response_model=RoomOut, tags=["Rooms"])
def get_room(room_id: int, db: Session = Depends(get_db)):
    """Get a single room by ID."""
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")
    return room


@app.post("/properties", response_model=RoomOut, status_code=201, tags=["Compatibility"])
@app.post("/rooms", response_model=RoomOut, status_code=201, tags=["Rooms"])
def create_room(body: RoomCreate, owner: UserModel = Depends(require_owner), db: Session = Depends(get_db)):
    """Create a new room listing. Requires owner account."""
    room = RoomModel(**body.model_dump(), owner_id=owner.id)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@app.put("/properties/{room_id}", response_model=RoomOut, tags=["Compatibility"])
@app.put("/rooms/{room_id}", response_model=RoomOut, tags=["Rooms"])
def update_room(
    room_id: int,
    body: RoomUpdate,
    owner: UserModel = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Update a room listing. Only the owner of the room can update it."""
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")
    if room.owner_id != owner.id:
        raise HTTPException(status_code=403, detail="You can only update your own listings.")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(room, field, value)
    db.commit()
    db.refresh(room)
    return room


@app.delete("/properties/{room_id}", status_code=204, tags=["Compatibility"])
@app.delete("/rooms/{room_id}", status_code=204, tags=["Rooms"])
def delete_room(
    room_id: int,
    owner: UserModel = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """Delete a room listing. Only the owner of the room can delete it."""
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")
    if room.owner_id != owner.id:
        raise HTTPException(status_code=403, detail="You can only delete your own listings.")
    db.delete(room)
    db.commit()


# ==========================================
# REVIEWS ROUTES
# ==========================================

@app.get("/rooms/{room_id}/reviews", response_model=List[ReviewOut], tags=["Reviews"])
def get_room_reviews(room_id: int, db: Session = Depends(get_db)):
    """Get all reviews for a specific room."""
    reviews = db.query(ReviewModel).filter(ReviewModel.room_id == room_id).all()
    result = []
    for r in reviews:
        result.append({
            "id": r.id,
            "room_id": r.room_id,
            "user_id": r.user_id,
            "rating": r.rating,
            "message": r.message,
            "author_name": r.author.name,
            "created_at": r.created_at,
        })
    return result


@app.get("/reviews", response_model=List[ReviewOut], tags=["Reviews"])
def get_all_reviews(db: Session = Depends(get_db)):
    """Get all reviews (latest first)."""
    reviews = db.query(ReviewModel).order_by(ReviewModel.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "room_id": r.room_id,
            "user_id": r.user_id,
            "rating": r.rating,
            "message": r.message,
            "author_name": r.author.name,
            "created_at": r.created_at,
        }
        for r in reviews
    ]


@app.post("/reviews", response_model=ReviewOut, status_code=201, tags=["Reviews"])
def submit_review(
    body: ReviewCreate,
    student: UserModel = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Submit or update a review for a room. Students only."""
    room = db.query(RoomModel).filter(RoomModel.id == body.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")

    # Update existing review if student already reviewed this room
    existing = db.query(ReviewModel).filter(
        ReviewModel.room_id == body.room_id,
        ReviewModel.user_id == student.id
    ).first()

    if existing:
        existing.rating = body.rating
        existing.message = body.message
        db.commit()
        db.refresh(existing)
        review = existing
    else:
        review = ReviewModel(
            room_id=body.room_id,
            user_id=student.id,
            rating=body.rating,
            message=body.message,
        )
        db.add(review)
        db.commit()
        db.refresh(review)

    return {
        "id": review.id,
        "room_id": review.room_id,
        "user_id": review.user_id,
        "rating": review.rating,
        "message": review.message,
        "author_name": student.name,
        "created_at": review.created_at,
    }


@app.delete("/reviews/{review_id}", status_code=204, tags=["Reviews"])
def delete_review(
    review_id: int,
    student: UserModel = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Delete your own review."""
    review = db.query(ReviewModel).filter(ReviewModel.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")
    if review.user_id != student.id:
        raise HTTPException(status_code=403, detail="You can only delete your own reviews.")
    db.delete(review)
    db.commit()


# ==========================================
# FAVORITES ROUTES
# ==========================================

@app.get("/favorites/ids", tags=["Compatibility"])
def favorite_ids(student: UserModel = Depends(require_student), db: Session = Depends(get_db)):
    return [f.room_id for f in db.query(FavoriteModel).filter(FavoriteModel.user_id == student.id).all()]


@app.get("/favorites", response_model=List[RoomOut], tags=["Favorites"])
def get_my_favorites(
    student: UserModel = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Get all favorited rooms for the logged-in student."""
    favs = db.query(FavoriteModel).filter(FavoriteModel.user_id == student.id).all()
    return [f.room for f in favs]


@app.post("/favorites/{room_id}", status_code=201, tags=["Favorites"])
def add_favorite(
    room_id: int,
    student: UserModel = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Add a room to favorites."""
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")
    already = db.query(FavoriteModel).filter(
        FavoriteModel.user_id == student.id,
        FavoriteModel.room_id == room_id
    ).first()
    if already:
        return {"message": "Already in favorites."}
    fav = FavoriteModel(user_id=student.id, room_id=room_id)
    db.add(fav)
    db.commit()
    return {"message": "Added to favorites!"}


@app.delete("/favorites/{room_id}", status_code=204, tags=["Favorites"])
def remove_favorite(
    room_id: int,
    student: UserModel = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Remove a room from favorites."""
    fav = db.query(FavoriteModel).filter(
        FavoriteModel.user_id == student.id,
        FavoriteModel.room_id == room_id
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Not in favorites.")
    db.delete(fav)
    db.commit()


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/", tags=["Health"])
def root():
    return {"message": "Homiego API is running!", "docs": "/docs"}
