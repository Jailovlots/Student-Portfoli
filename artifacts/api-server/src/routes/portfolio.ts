import { Router, type Response } from "express";
import { db, portfoliosTable, usersTable, documentsTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth.js";

const portfolioRouter = Router();

portfolioRouter.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    const [portfolio] = await db.select().from(portfoliosTable).where(eq(portfoliosTable.userId, userId));
    const documents = await db.select().from(documentsTable).where(eq(documentsTable.portfolioId, userId));
    const notifications = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, userId));

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found." });
    }

    res.json({
      ...portfolio,
      userName: user.name,
      userEmail: user.email,
      documents,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch portfolio." });
  }
});

portfolioRouter.post("/submit", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await db.update(portfoliosTable)
      .set({
        submissionStatus: "pending_review",
        submittedAt: new Date(),
      })
      .where(eq(portfoliosTable.userId, userId));

    await db.insert(notificationsTable).values({
      userId,
      title: "Portfolio Submitted",
      message: "Your enrollment portfolio has been submitted for review.",
      type: "info",
    });

    res.json({ message: "Portfolio submitted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit portfolio." });
  }
});

portfolioRouter.post("/documents", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { type, uri, fileName, fileSize, mimeType } = req.body;

    // Check if document exists
    const [existing] = await db.select()
      .from(documentsTable)
      .where(and(eq(documentsTable.portfolioId, userId), eq(documentsTable.type, type)));

    if (existing) {
      await db.update(documentsTable)
        .set({ uri, fileName, fileSize, mimeType, uploadedAt: new Date(), status: "uploaded" })
        .where(eq(documentsTable.id, existing.id));
    } else {
      await db.insert(documentsTable).values({
        portfolioId: userId,
        type,
        uri,
        fileName,
        fileSize,
        mimeType,
        uploadedAt: new Date(),
        status: "uploaded",
      });
    }

    res.json({ message: "Document uploaded successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to upload document." });
  }
});

export default portfolioRouter;
