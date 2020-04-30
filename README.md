# Sample App - Microsoft Teams Service Now Bot

This is a sample app that connects to the Service Now REST APIs through a webservice account and enables a personal bot to:

- Create a new ticket with the requestor as the Caller
- List existing tickets where user is the Caller
- Get a single ticket by Number

** This sample code is provided as is. **

## What to know about this sample

- It has a "Check tenant ID" function that blocks requests from non authorized tenants
- It only supports personal context bots
- It requires a webservice Service Now account with Get Incidents, Create Incidents and Get Users permissions
- It assumes that Microsoft Teams users User Principal Name (UPN) is the same as the user e-mail in Service Now

## How to deploy this sample

1. Create a new *Web App* with Windows App Service Plan with and a Bot Channel Registration or a new Web App Bot.
2. Add the following keys in the *Configuration* -> *Application Settings*
    - Name = `WEBSITE_NODE_DEFAULT_VERSION`, Value = `8.10.0`
    - Name = `SCM_COMMAND_IDLE_TIMEOUT`, Value = `1800`
    - Name = `MICROSOFT_APP_ID`, Value = `MICROSOFT_APP_ID`
    - Name = `MICROSOFT_APP_PASSWORD`, Value = `MICROSOFT_APP_PASSWORD`
    - Name = `TENANT_ID`, Value = `TENANT_ID`
    - Name = `CHECK_TENANT`, Value = `CHECK_TENANT`
    - Name = `SERVICE_NOW_CREDENTIALS`, Value = `SERVICE_NOW_CREDENTIALS`
    - Name = `SERVICE_NOW_INSTANCE`, Value = `SERVICE_NOW_INSTANCE`
3. Deploy the code to Azure through git, Visual Code Azure App Service extension

If you have any issues, please share that in this repository. 