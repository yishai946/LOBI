import { Router } from "express";
import {
  createIssue,
  getIssueUploadUrl,
  getIssues,
  getMyIssues,
  updateIssue,
} from "../controllers/issue.controller";
import { requireManager, requireResident } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createIssueSchema,
  issueUploadUrlSchema,
  updateIssueSchema,
} from "../validators/issue.validator";

const router = Router();

router.post("/", requireResident, validate(createIssueSchema), createIssue);
router.get("/mine", requireResident, getMyIssues);
router.get("/", requireManager, getIssues);
router.patch("/:id", requireManager, validate(updateIssueSchema), updateIssue);

router.post(
  "/upload-url",
  requireResident,
  validate(issueUploadUrlSchema),
  getIssueUploadUrl,
);

export default router;
