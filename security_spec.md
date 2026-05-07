# Security Specification - GamerMatch

## Data Invariants
1. A squad cannot have more members than `maxMembers`.
2. Only the squad leader can change the squad status to `in-game` or `closed`.
3. Players can only see invitations directed to them or requests they sent.
4. Notifications are strictly private to the `userId`.
5. Reputation is immutable by the user themselves (only others or system can vote).

## The "Dirty Dozen" Payloads (Denial Tests)
1. **Identity Spoofing**: Attempt to create a squad with a `leaderId` that doesn't match the current user's UID.
2. **Privilege Escalation**: Attempt to update a squad's `members` list as a non-leader.
3. **Resource Poisoning**: Use a 1MB string as a `title` or `description`.
4. **Member Overflow**: Attempt to add a 6th member to a 5-max squad.
5. **PII Leak**: Attempt to read the private profile of another user.
6. **Self-Reputation Boost**: User attempting to increment their own reputation field.
7. **Phantom Invitations**: Create an invitation for a non-existent squad.
8. **Shadow Update**: Add a `isVerified: true` ghost field to a user profile.
9. **Status Shortcutting**: Directly closing a squad without being the leader.
10. **Query Scaping**: Attempting to list ALL user profiles without a UID filter.
11. **Timestamp Spoofing**: Sending a `createdAt` date from 2020.
12. **ID Injection**: Using malicious characters like `../` in a document ID.

## Firestore Rules Pattern
- **isValidId(id)**: regex check and size limit.
- **isValidUser(data)**: type safety, schema adherence.
- **isValidSquad(data)**: max member constraints, leader validation.
- **Master Gate**: Access to squad members list derived from membership check.
