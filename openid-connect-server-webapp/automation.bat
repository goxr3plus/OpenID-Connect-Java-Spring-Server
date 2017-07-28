ECHO Automation Bot Building and Deploying Web Application...

cd "C:\Users\GOXR3PLUS\Documents\OpenID-Connect-Java-Spring-Server\"
DEL /F /Q /A "C:\xampp\tomcat\webapps\openid-connect-server-webapp.war"
rmdir /s /q "C:\xampp\tomcat\webapps\openid-connect-server-webapp\"
ECHO Finishing....

mvn -Dmaven.javadoc.skip=true -DskipTests package
@pause


