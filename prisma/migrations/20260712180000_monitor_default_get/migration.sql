-- AlterEnum default for website_monitors.method to GET (better host compatibility)
ALTER TABLE "website_monitors" ALTER COLUMN "method" SET DEFAULT 'GET';
