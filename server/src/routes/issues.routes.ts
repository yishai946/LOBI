import { Router } from "express";
import {
  createIssue,
  deleteIssue,
  generateUploadUrls,
  getIssueById,
  getIssues,
  moveIssueToNextStatus,
  updateIssue,
} from "../controllers/issues.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  createIssueSchema,
  updateIssueSchema,
  uploadUrlsSchema,
} from "../validators/issue.validator";

const router = Router();

router.post("/upload-urls", validate(uploadUrlsSchema), generateUploadUrls);
router.post("/", validate(createIssueSchema), createIssue);
router.get("/", getIssues);
router.get("/:issueId", getIssueById);
router.patch("/:issueId", validate(updateIssueSchema), updateIssue);
router.patch("/:issueId/next-status", moveIssueToNextStatus);
router.delete("/:issueId", deleteIssue);

export default router;
