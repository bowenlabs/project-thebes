import { createCollectionListPage } from "@bowenlabs/cadmea/tanstack-start";
import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import { pagesCollection } from "../../../../../../cadmea.config.js";
import { getPages } from "../../../server-functions/pages";

export const Route = createFileRoute("/admin/pages/")({
  component: PagesPage,
});

function PagesPage() {
  const navigate = useNavigate();

  const Page = createCollectionListPage({
    collection: pagesCollection,
    label: "Pages",
    queryKey: ["pages"],
    queryFn: () => getPages(),
    newHref: "/admin/pages/new",
    newLabel: "New page",
    onRowClick: (row) =>
      navigate({
        to: "/admin/pages/$pageId",
        params: { pageId: String(row.id) },
      }),
  });

  return <Page />;
}
