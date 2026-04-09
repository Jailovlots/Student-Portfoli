import { Router, type Request, type Response } from "express";
import { db, portfoliosTable, usersTable, documentsTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate, isAdmin, type AuthRequest } from "../middlewares/auth.js";

const adminRouter = Router();

adminRouter.get("/portfolios", authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const portfolios = await db.select().from(portfoliosTable);
    const result = [];

    for (const portfolio of portfolios) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, portfolio.userId));
      const documents = await db.select().from(documentsTable).where(eq(documentsTable.portfolioId, portfolio.userId));
      const notifications = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, portfolio.userId));

      result.push({
        ...portfolio,
        userName: user?.name,
        userEmail: user?.email,
        documents,
        notifications,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch all portfolios." });
  }
});

adminRouter.post("/portfolios/:userId/status", authenticate, isAdmin, async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, note } = req.body;

    await db.update(portfoliosTable)
      .set({
        submissionStatus: status as any,
        reviewedAt: new Date(),
        adminNote: note,
      })
      .where(eq(portfoliosTable.userId, Number(userId)));

    // Create notification
    let title = "Status Updated";
    let message = "Your enrollment status has been updated.";
    let type = "info";

    if (status === "approved") {
      title = "Portfolio Approved!";
      message = "Congratulations! Your enrollment portfolio has been approved.";
      type = "success";
    } else if (status === "revisions_needed") {
      title = "Revisions Needed";
      message = note || "Some documents need revision. Please review the feedback.";
      type = "warning";
    }

    await db.insert(notificationsTable).values({
      userId: Number(userId),
      title,
      message,
      type,
    });

    res.json({ message: "Portfolio status updated." });
  } catch (error) {
    res.status(500).json({ message: "Failed to update portfolio status." });
  }
});

adminRouter.post("/portfolios/:userId/documents/:type/status", authenticate, isAdmin, async (req: any, res: Response) => {
  try {
    const { userId, type } = req.params;
    const { status, note } = req.body;

    await db.update(documentsTable)
      .set({
        status: status as any,
        adminNote: note,
      })
      .where(and(eq(documentsTable.portfolioId, Number(userId)), eq(documentsTable.type, type as any)));

    res.json({ message: "Document status updated." });
  } catch (error) {
    res.status(500).json({ message: "Failed to update document status." });
  }
});

export default adminRouter;
