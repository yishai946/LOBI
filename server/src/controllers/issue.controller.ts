import { Request, Response } from "express";
import * as issueService from "../services/issue.service";

export const createIssue = async (req: Request, res: Response) => {
  const result = await issueService.createIssue(req.user, req.body);

  res.status(201).json({
    message: "Issue created successfully",
    issue: result.issue,
    uploads: result.uploads,
  });
};

export const getMyIssues = async (req: Request, res: Response) => {
  const issues = await issueService.getMyIssues(req.user);

  res.json(issues);
};

export const getIssues = async (req: Request, res: Response) => {
  const buildingId = req.query.buildingId as string | undefined;
  const issues = await issueService.getIssues(req.user, buildingId);

  res.json(issues);
};

export const updateIssue = async (req: Request, res: Response) => {
  const issue = await issueService.updateIssue(
    req.user,
    req.params.id as string,
    req.body,
  );

  res.json({
    message: "Issue updated successfully",
    issue,
  });
};

export const getIssueUploadUrl = async (req: Request, res: Response) => {
  const result = await issueService.createIssueImageUpload(req.user, req.body);

  res.status(201).json(result);
};
