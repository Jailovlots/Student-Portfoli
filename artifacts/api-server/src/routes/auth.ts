import { Router, type Request, type Response } from "express";
import { db, usersTable, portfoliosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const authRouter = Router();

// Secret should be in env
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, studentId } = req.body;

    // Check if user exists
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db.insert(usersTable).values({
      name,
      email,
      password: hashedPassword,
      role: "student",
      studentId,
    }).returning();

    // Create empty portfolio
    await db.insert(portfoliosTable).values({
      userId: newUser.id,
      submissionStatus: "draft",
    });

    // Create token
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET);

    const { password: _, ...userWithoutPw } = newUser;
    res.status(201).json({ user: userWithoutPw, token });
  } catch (error) {
    res.status(500).json({ message: "Registration failed." });
  }
});

authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Admin login mock?
    if (email === "admin@school.edu" && password === "admin123") {
      let [admin] = await db.select().from(usersTable).where(eq(usersTable.email, email));
      if (!admin) {
        // Create it if it doesn't exist
        const hashedPassword = await bcrypt.hash("admin123", 10);
        [admin] = await db.insert(usersTable).values({
          name: "Admin User",
          email: "admin@school.edu",
          password: hashedPassword,
          role: "admin",
        }).returning();
      }
      const token = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET);
      const { password: _, ...userWithoutPw } = admin;
      return res.json({ user: userWithoutPw, token });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);

    const { password: _, ...userWithoutPw } = user;
    res.json({ user: userWithoutPw, token });
  } catch (error) {
    res.status(500).json({ message: "Login failed." });
  }
});

export default authRouter;
