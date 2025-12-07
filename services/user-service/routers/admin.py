from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List

from database.models import Company, User, CompanyUser, Ticket, Payment, Bus, Route, Schedule
from common.database import get_db_engine, get_db_session

# Simple Dependency
def get_db():
    engine = get_db_engine("user")
    db = next(get_db_session(engine))
    try:
        yield db
    finally:
        db.close()

# Stub for super admin permission until we migrate permissions fully
def get_current_super_admin_user():
    # In microservices, this would start by validating the token (via Auth Service or shared secret)
    # Then checking if the user role is 'super_admin'.
    # For MVP (Phase 1), we will assume if the gateway let it through and we have a valid token (TODO middleware), 
    # we trust it - BUT realistically we need to decode token here.
    return True 

router = APIRouter(prefix="/api/v1/admin", tags=["Super Admin"])

@router.get("/users")
async def get_all_users(
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_super_admin_user) 
):
    """Get all users (regular users and company users)"""
    regular_users = db.query(User).all()
    company_users = db.query(CompanyUser).all()
    
    return {
        "regular_users": [
            {
                "id": str(u.id),
                "full_name": u.full_name,
                "email": u.email,
                "phone_number": u.phone_number,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in regular_users
        ],
        "company_users": [
            {
                "id": str(u.id),
                "full_name": u.full_name,
                "email": u.email,
                "login_email": u.login_email,
                "company_id": str(u.company_id),
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in company_users
        ]
    }

# Also migrate /stats logic?
# Yes, User Service might handle system analytics or specialized Analytics Service.
# For now, let's keep it here.

@router.get("/stats")
async def get_system_stats(
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_super_admin_user)
):
    """Get system-wide statistics"""
    total_companies = db.query(func.count(Company.id)).scalar()
    total_users = db.query(func.count(User.id)).scalar()
    total_company_users = db.query(func.count(CompanyUser.id)).scalar()
    total_tickets = db.query(func.count(Ticket.id)).scalar()
    total_buses = db.query(func.count(Bus.id)).scalar()
    total_routes = db.query(func.count(Route.id)).scalar()
    
    # Revenue calculation
    total_revenue = db.query(func.sum(Payment.amount)).filter(
        Payment.status == "success"
    ).scalar() or 0
    
    return {
        "total_companies": total_companies,
        "total_users": total_users,
        "total_company_users": total_company_users,
        "total_tickets": total_tickets,
        "total_buses": total_buses,
        "total_routes": total_routes,
        "total_revenue": float(total_revenue)
    }
