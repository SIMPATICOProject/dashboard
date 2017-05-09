# Dashboard
Dashboard is a decision support system that provides different layers of information to be used by civil servants to enrich the interaction with the users.

## Installation Requirements
- Java 1.8+
- J2EE Servlet Container (Tomcat 7+)
- Java IDE (Eclipse)

## Installation
1. Export the project as a WAR file
2. Deploy WAR file into Tomcat webapps folder
	
## Configuration
Inside `src/main/resources` the are 2 files to review:
- dasboard.properties: includes general configuration
- users.yml: includes the user to log in

In order for the tab `Enrichment engine data` to work properly, open the file `src/main/webapp/resources/js/app.js` and change the `simpaticoURL` to your LOG server address.

## i18n
In order to translate everything to different languages follow the steps inside file `src/main/webapp/resources/lang/translator.js`, in the big comment at the top.
