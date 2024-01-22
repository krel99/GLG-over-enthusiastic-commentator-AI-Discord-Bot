# Discord Bot With AI Embeddings

Running this application with all dependencies set (incl. enviromental variables, Supabase, Discord) will log in to discord and answer any question with relevant match that is reacted to with "🤖" during the set window.

The bot will convert the query to a standalone question, which will be converted to vector embeddings and tested against the database. In the current configuration, only the nearest match will be returned. Both, the original query and the database context is sent to ChatGPT's default model. An answer will be pasted to Discord as a message reply.

## Detailed Functionality

1. Initialize Application

   - Load dependencies
   - Check if there are environment variables || exits on false
   - Initialize Discord client
   - Connect to Supabase

2. Log in to Discord

   - Use bot token to authenticate

3. Listen for Messages on Discord

   - Listen for any new messages
   - Attach reaction listener to any new message
   - "🤖" will trigger the bot to respond

4. Process Message

   - Convert message to standalone question
   - Convert question to vector embeddings

5. Query Database

   - Search database for nearest match using embeddings
   - Return a set number of matching results (1 in the current version)

6. Formulate Response

   - Combine original query and database context
   - Send to ChatGPT's default model

7. Post Answer to Discord
   - Receive response from ChatGPT
   - Post as a message reply to the Discord channel
8. Rating The Answer
   - I user decides to rate the answer, it is saved to database along with the chunk and other relevant information
