import { Router, type Response } from "express";
import { db, portfoliosTable, usersTable, documentsTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

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

    return res.json({
      ...portfolio,
      userName: user?.name,
      userEmail: user?.email,
      documents,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch portfolio." });
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

    return res.json({ message: "Portfolio submitted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit portfolio." });
  }
});

portfolioRouter.post("/documents", authenticate, upload.single("file"), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const uri = `/uploads/${file.filename}`;
    const fileName = file.originalname;
    const fileSize = file.size;
    const mimeType = file.mimetype;

    // Check if document exists
    const [existing] = await db.select()
      .from(documentsTable)
      .where(and(eq(documentsTable.portfolioId, userId), eq(documentsTable.type, type)));

    if (existing) {
      // Remove old file if exists
      if (existing.uri && existing.uri.startsWith("/uploads/")) {
        const oldPath = path.join(process.cwd(), existing.uri);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

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

    return res.json({ message: "Document uploaded successfully.", uri });
  } catch (error) {
    console.error("Upload error", error);
    return res.status(500).json({ message: "Failed to upload document." });
  }
});

portfolioRouter.delete("/documents/:type", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { type } = req.params;

    await db.delete(documentsTable)
      .where(and(eq(documentsTable.portfolioId, userId), eq(documentsTable.type, type as any)));

    return res.json({ message: "Document removed successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove document." });
  }
});

portfolioRouter.patch("/notifications/:id/read", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    await db.update(notificationsTable)
      .set({ read: true })
      .where(and(eq(notificationsTable.id, Number(id)), eq(notificationsTable.userId, userId)));

    return res.json({ message: "Notification marked as read." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update notification." });
  }
});

export default portfolioRouter;
