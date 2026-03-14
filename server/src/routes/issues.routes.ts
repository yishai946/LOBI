import { Router } from "express";
import {
  createIssue,
  deleteIssue,
  generateUploadUrls,
  getIssueById,
  getIssues,
  updateIssue,
} from "../controllers/issues.controller";
import {
  requireManagerOrResident,
  requireResident,
} from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createIssueSchema,
  updateIssueSchema,
  uploadUrlsSchema,
} from "../validators/issue.validator";

const router = Router();

router.post(
  "/upload-urls",
  requireResident,
  validate(uploadUrlsSchema),
  generateUploadUrls,
);

router.post("/", requireManagerOrResident, validate(createIssueSchema), createIssue);
router.get("/", requireManagerOrResident, getIssues);
router.get("/:issueId", requireManagerOrResident, getIssueById);
router.patch(
  "/:issueId",
  requireManagerOrResident,
  validate(updateIssueSchema),
  updateIssue,
);
router.delete("/:issueId", requireManagerOrResident, deleteIssue);

export default router;
