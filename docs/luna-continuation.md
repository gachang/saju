# Luna-only report generation

Production drafting, paragraph/title repair and editorial review use `gpt-5.6-luna` with low reasoning. Offline evaluation can still explicitly select other supported models; the production route does not.

Every actual model dispatch (including retry) is paced at least seven seconds apart within a function instance. This is not an account-wide quota: upstream token/request reset headers and retry-after are still respected. Multiple Vercel instances can share the same account limits, so global admission control remains necessary for a public launch.

The client keeps a server-signed checkpoint in component memory when a validated partial report is available. It is bound to the canonical chart pair and name lengths, expires after 30 minutes and allows at most three server processing segments. No partial report is presented as complete. A final response still requires all deterministic and editorial checks to pass.

Quality or deadline continuation reuses the partial report and repairs only failed sections. Rate-limit errors pause instead of automatically looping; the user can retry from the same page after limits recover. Reloading/closing the page discards the in-memory checkpoint. The checkpoint is signed (not encrypted), contains generated text, and must never be logged or treated as an authentication/session token. It contains no raw birth dates or names and is not stored in a server database. Signatures use a domain-separated HMAC with the existing server credential, so credential rotation invalidates previous checkpoints.

The resume-attempt limit is a UX/cost backstop, not replay protection. Authentication and distributed quotas are still required before unrestricted public usage.
