/**
 * Scrape Route
 *
 * POST /api/idexx/scrape - On-demand scraping endpoint
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { logger } from "../lib/logger";
import { SCRAPE_TYPES } from "../config";
import { ScrapeService } from "../services";
import type { ScrapeRequest, ScrapeResponse, ScrapeType } from "../types";

export const scrapeRouter: ReturnType<typeof Router> = Router();

/**
 * POST /api/idexx/scrape
 *
 * On-demand scraping endpoint for IDEXX Neo data.
 */
scrapeRouter.post("/scrape", (req: Request, res: Response) => {
  void handleScrape(req, res);
});

async function handleScrape(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const body = req.body as Partial<ScrapeRequest>;

  // Validate request body
  const { type, clinicId, date } = body;

  if (!type || !isValidScrapeType(type)) {
    res.status(400).json({
      success: false,
      error: "Invalid or missing 'type'. Must be 'schedule' or 'consultation'.",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!clinicId || typeof clinicId !== "string") {
    res.status(400).json({
      success: false,
      error: "Missing or invalid 'clinicId'. Must be a valid UUID string.",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Validate date format if provided
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({
      success: false,
      error: "Invalid 'date' format. Must be YYYY-MM-DD.",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info(
    `Starting ${type} scrape for clinic ${clinicId}${date ? ` (date: ${date})` : ""}`,
  );

  try {
    const scrapeService = new ScrapeService();
    const result = await scrapeService.run({
      type,
      clinicId,
      date,
    });

    const response: ScrapeResponse = {
      success: result.success,
      sessionId: result.sessionId,
      scrapeType: type,
      recordsScraped: result.recordsScraped,
      errors: result.errors,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };

    logger.info(
      `${type} scrape completed: ${result.recordsScraped} records in ${response.durationMs}ms`,
    );

    res.status(result.success ? 200 : 500).json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    logger.error(`${type} scrape request failed: ${errorMessage}`);

    const response: ScrapeResponse = {
      success: false,
      scrapeType: type,
      recordsScraped: 0,
      errors: [errorMessage],
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
}

function isValidScrapeType(type: string): type is ScrapeType {
  return type === SCRAPE_TYPES.SCHEDULE || type === SCRAPE_TYPES.CONSULTATION;
}
