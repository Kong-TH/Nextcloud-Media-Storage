# System Design

## Hierarchy

Use stable node identifiers and parent-child relationships. A logical root belongs to one owner. Paths are derived, never authoritative IDs. Validate each decoded segment; reject empty names, separators, dot segments, control characters and traversal. Define Unicode and case comparison consistently before migration implementation.

Create/rename/move must verify owner, parent type, sibling uniqueness and acyclicity. A database uniqueness constraint must enforce the same name comparison rules as the service. Serialize conflicting hierarchy mutations per owner using a target-supported mechanism; a preflight duplicate/cycle check alone is insufficient under concurrent requests.

Folder deletion removes virtual descendants and bindings transactionally, never physical files. Specify bounded traversal and pagination. Bindings may be replaced explicitly after authorization.

## Files

Resolve through `IRootFolder::getUserFolder` and public Folder/File/Node APIs, after checking target signatures. Require exactly one accessible file matching the stored context; ambiguous or mismatched identities fail closed. A last-known path is a recovery hint, not authority to silently bind a different file. Explicit rebind requires authorization and records new identity information.

Moving/renaming virtual nodes does not move physical files. Deleting and recreating a physical path does not establish identity. Shared/mounted storage requires underlying permissions and verified context; unsupported contexts must be rejected explicitly.

Virtual paths change after rename/move. Previously issued path URLs can break. Aliases are future scope, not a current guarantee.
