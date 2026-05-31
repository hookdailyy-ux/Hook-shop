import type { Request, Response, NextFunction } from "express";

export function requireTeamMember(req: Request, res: Response, next: NextFunction) {
  if (req.session?.teamMemberId) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}
