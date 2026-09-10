# Local operator design review

The `/operator/review` route is an interactive development review inside the existing app. It requires `NODE_ENV=development`, an exact loopback Host and an explicit `OPERATOR_REVIEW_DATA_PATH`. Run the dev server bound to `127.0.0.1`. Production requests return not found even if a snapshot path is configured.

The snapshot is a private JSON file outside this repository. It supplies a workspace name, location, source text and reviewable rules. It is validated before rendering. Do not commit real restaurant snapshots, sources or screenshots to this public repository.

Working interactions: workspace navigation, source dialog, rule review, keyword search over imported rules, draft handoff with owner and due time, JSON export of review changes, and spirit cost calculation from supplied inputs. Selected raster images can be previewed using local browser object URLs; files are not uploaded or OCR'd by this route. The automated browser file chooser test was blocked by the browser extension's file URL permission, so end to end photo selection is not verified.

All review changes stay in page state until exported. The review does not authenticate users, create seats, send messages, call a conversational model, sync to a restaurant or update production rules. The banner says so. It must not be described as the live restaurant portal.

Source based example rules were manually selected for design review and have not been confirmed as current operating policy. The original source is available in the dialog. This review does not certify source completeness or accounting rules.

Verification: production build and TypeScript check; focused tests for production denial, configured localhost requirement and US fluid ounce calculation; browser checks for navigation, source dialog, rule toggle, keyword search, required handoff fields, local draft confirmation and pour result; desktop and 390px phone layout review. The original `/operator` route remains separately available.
