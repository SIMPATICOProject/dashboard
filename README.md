# Dashboard
Dashboard is a decision support system that provides different layers of information to be used by civil servants to enrich the interaction with the users.

## Instalation Requirements
- Java 1.8+
- J2EE Servlet Container (Tomcat 7+)
- Java IDE (Eclipse)

## Instalation
1. Export the project as a WAR file
2. Deploy WAR file into Tomcat webapps folder
	
## Configuration
Inside `src/main/resources` the are 2 files to review:
- dasboard.properties: includes general configuration
- users.yml: includes the user to log in

## i18n
In order to translate everything to different languages follow the steps inside file `src/main/webapp/resources/lang/translator.js`, in the big comment at the top.