import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

const rolesAllowed: string[] = ['manager', 'developer'];

export const requireOwnership = (roles?: string | string[]) => {  
    return (req: AuthRequest, res: Response, next: NextFunction) => {    
        if (!req.user) return res.status(401).json({ message: "Forbidden: authorization details not found, Please try again" });    
        
        // const requiredRolesArray = roles ? (Array.isArray(roles) ? roles : [roles]) : [];
        
        // if (requiredRolesArray.length === 0) {
        //     return next();
        // }
    
        // if (!requiredRolesArray.includes(req.user.role)) {
        //   return res.status(403).json({
        //     message: `Forbidden: insufficient role. Requires one of: ${requiredRolesArray.join(', ')}`
        //   });
        // }

        next();
    };
}