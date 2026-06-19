import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getPages } from "../../../server-functions/pages";

export const Route = createFileRoute("/admin/pages/")({
  component: PagesPage,
});

function PagesPage() {
  const { data: pages, isLoading } = useQuery({
    queryKey: ["pages"],
    queryFn: () => getPages(),
    // pages type inferred from Drizzle schema — no manual typing
  });

  if (isLoading) return <div className="loading loading-spinner" />;
  return <pre>{JSON.stringify(pages, null, 2)}</pre>;
}
