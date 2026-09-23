# SWAPI Viewer

This application allows for structured viewing of the [SWAPI](https://swapi.info/). Data is persisted in the browser's IndexDB allowing for offline use and mutation over multiple reloads.

## Setup

### Local Build

**Prerequisites**
- Node 22 or newer
- pnpm 9 or newer

**Steps**
1. install relevant dependencies using `pnpm i`
2. create a production build using `pnpm build`
3. start webserver using `pnpm start`

## Decisions

### Prefer URL State Management
Searching, selecting and filtering is implemented using URL state management (using react-router). This gives us two advantages:
1. State is sharable, making it extremely easy to share a view as-is with another user
2. Allow for browser defaults to handle navigation

The second is extremely powerful, as when a user selects a resource within the `DetailPanel` we override its content and the selected filters, so that the newly selected resource is highlighted in the `SearchResultView`. If the user is done they can use back navigation to get back to their old state, including their filters.

To accommodate this filter and search updates rewrite the url (override the current history element), while clicking on a resource adds a new history item.

### Data fetching is local first
The surface of SWAPI is well-defined and updates are extremely infrequent. As such we can cache all requests with a long TTL (7 days seems like a good default). Since we display the whole list of elements on first load, we essentially query everything and persist it locally, allowing for subsequent requests to essentially skip a network roundtrip.

By caching the app code this should make it extremely easy to achieve full offline support (but hasn't been implemented).

### Validate data
Data validation is done using `valibot`, which allows us mature type contracts. While the current data surface is very rudimentary, and we could roll our own validation, depending on further additions a tested solution is better in the long run. I'm using `valibot` instead of `arktype` or `zod` as the former produces a smaller bundle at comparable feature and runtime experience. For this frontend only application that is the perfect use case as we want to keep bundle sizes small.

## Additional thoughts

### Why indexedDB?
I used indexedDb as a local cache and storage for mutations, instead of local storage and session storage, since it is specifically made for use cases with bigger structured data. The other mentioned storage mediums only allow for around 5mb, adding many complex edits or local entries could break that.

### Why no virtualization?
I've purposefully skipped virtualization, as it seemed overkill for the current use case. HTML is extremely optimized for displaying multiple 1,000s if not 10,000s of entries.

Unless we are made aware of power users that make use of these numbers of entries it is completely unnecessary to add.

In addition should such a need arise, we must consider if it wouldn't be easier to paginating, filtering and searching for data server-side instead, as virtualization introduces new problems that we didn't need to think about before (searchability and scroll position are no longer guarantees).

### What about optimistic updates?
I've skipped handling optimistic updates and rollback support in the current implementation. Since any data mutation occurs client-side, the chance of mutation failing is negligible. If we would persist the data server side and would need to sync across clients this would be a much bigger priority.

### Deletions
Deletions are implemented as soft deletes, simply because I didn't have a great idea right now on how to handle edge cases when restoring them. Restore isn't implemented.