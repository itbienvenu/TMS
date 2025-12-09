from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List
from database.dbs import get_db
from database.models import Company, User, CompanyUser, Ticket, Payment, Bus, Route, Schedule
from methods.permissions import get_current_super_admin_user

router = APIRouter(prefix="/api/v1/admin", tags=["Super Admin"])


@router.get("/stats")
async def get_system_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_super_admin_user)
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


@router.get("/companies/{company_id}/stats")
async def get_company_stats(
    company_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_super_admin_user)
):
    """Get statistics for a specific company"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    total_tickets = db.query(func.count(Ticket.id)).filter(
        Ticket.company_id == company_id
    ).scalar()
    
    total_buses = db.query(func.count(Bus.id)).filter(
        Bus.company_id == company_id
    ).scalar()
    
    total_routes = db.query(func.count(Route.id)).filter(
        Route.company_id == company_id
    ).scalar()
    
    total_schedules = db.query(func.count(Schedule.id)).filter(
        Schedule.company_id == company_id
    ).scalar()
    
    # Company revenue
    company_revenue = db.query(func.sum(Payment.amount)).join(
        Ticket, Payment.ticket_id == Ticket.id
    ).filter(
        Ticket.company_id == company_id,
        Payment.status == "success"
    ).scalar() or 0
    
    return {
        "company_id": company_id,
        "company_name": company.name,
        "total_tickets": total_tickets,
        "total_buses": total_buses,
        "total_routes": total_routes,
        "total_schedules": total_schedules,
        "revenue": float(company_revenue)
    }


@router.get("/users")
async def get_all_users(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_super_admin_user)
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


@router.get("/tickets")
async def get_all_tickets(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_super_admin_user)
):
    """Get all tickets across all companies"""
    tickets = db.query(Ticket).all()
    
    return [
        {
            "id": str(t.id),
            "user_id": str(t.user_id),
            "company_id": str(t.company_id),
            "status": t.status,
            "mode": t.mode,
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in tickets
    ]


@router.get("/revenue")
async def get_revenue_report(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_super_admin_user)
):
    """Get revenue report across all companies"""
    # Total revenue
    total_revenue = db.query(func.sum(Payment.amount)).filter(
        Payment.status == "success"
    ).scalar() or 0
    
    # Revenue by company
    company_revenues = db.query(
        Company.id,
        Company.name,
        func.sum(Payment.amount).label("revenue")
    ).join(
        Ticket, Ticket.company_id == Company.id
    ).join(
        Payment, Payment.ticket_id == Ticket.id
    ).filter(
        Payment.status == "success"
    ).group_by(Company.id, Company.name).all()
    
    return {
        "total_revenue": float(total_revenue),
        "by_company": [
            {
                "company_id": str(cr.id),
                "company_name": cr.name,
                "revenue": float(cr.revenue)
            }
            for cr in company_revenues
        ]
    }

