import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/lib/error-component";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/$")({
  head: () => pageHead("Not in the Stacks", "No route with that name. Absence, not invention."),
  component: NotFoundPage,
});
