import type { Metadata } from "next";
import { CloseBoard } from "@/components/close/close-board";

export const metadata: Metadata = {
  title: "The board | Never86.ai",
  description:
    "Drop yesterday's close for 1 to 9 units. Never86.ai sorts the files, tallies the week, and leaves at most three moves.",
};

export default function ClosePage() {
  return <CloseBoard />;
}
