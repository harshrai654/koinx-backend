# koinx-backend

## API endpoints: 
- /transactions?account=[account-id]
  > Fetches all transactions of given account id from etherscan api
  
- /balance?account=[account-id]
  > Calculates balance from storeed transactions from database
  
### rateFetchService
> Fetches current ethereum price in INR and stores in database

### How to run
- Clone the repository
- run `npm i` to install dependencies
- Create a database locally or in cloud
- Create a `.env` file to store folowing environment variables
  - **PORT** : port in which you want to run the server. (default is 3001) 
  - **ETHERSCAN_API_KEY**: Ethercan API Key to fetch transactions
  - **API_ENDPOINT**: Ethereum etherscan endpoint 
  - **RATE_API_ENDPOINT**: Any crypto API to get crypto value in various currencies Example: ("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr")
  - **DB_ENDPOINT**: MongoDB URI
- After creation of above mentioned environment variables, run `node index.js`.
