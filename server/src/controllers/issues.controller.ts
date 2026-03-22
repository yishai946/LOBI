import { Request, Response } from "express";
import * as issuesService from "../services/issues.service";
import { IssueStatus } from "../enums/issueStatus.enum";
import {
  parseEnumQueryParam,
  parsePaginationQuery,
  parseSortOrderQuery,
} from "../utils/pagination";

export const generateUploadUrls = async (req: Request, res: Response) => {
  const result = await issuesService.createUploadUrls(req.user, req.body);

  res.json(result);
};

export const createIssue = async (req: Request, res: Response) => {
  const issue = await issuesService.createIssue(req.user, req.body);

  res.status(201).json({
    message: "Issue created successfully",
    issue,
  });
};

export const getIssues = async (req: Request, res: Response) => {
  const pagination = parsePaginationQuery(req.query);
  const status = parseEnumQueryParam(
    req.query.status,
    "status",
    Object.values(IssueStatus),
  );
  const sort = parseSortOrderQuery(req.query.sort);
  const issues = await issuesService.getIssues(req.user, pagination, {
    status,
    sortByCreatedAt: sort,
  });

  res.json(issues);
};

export const getIssueById = async (req: Request, res: Response) => {
  const issue = await issuesService.getIssueById(
    req.user,
    req.params.issueId as string,
  );

  res.json(issue);
};

export const updateIssue = async (req: Request, res: Response) => {
  const issue = await issuesService.updateIssue(
    req.user,
    req.params.issueId as string,
    req.body,
  );

  res.json({
    message: "Issue updated successfully",
    issue,
  });
};

export const moveIssueToNextStatus = async (req: Request, res: Response) => {
  const issue = await issuesService.moveIssueToNextStatus(
    req.user,
    req.params.issueId as string,
  );

  res.json({
    message: "Issue status updated successfully",
    issue,
  });
};

export const deleteIssue = async (req: Request, res: Response) => {
  const issue = await issuesService.deleteIssue(
    req.user,
    req.params.issueId as string,
  );

  res.json({
    message: "Issue deleted successfully",
    issue,
  });
};
