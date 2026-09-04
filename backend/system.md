/system script remove [find name="CloudPing"]
/system scheduler remove [find name="Run_CloudPing"]

/system script add name="CloudPing" policy=read,write,test,ftp source={
    /tool fetch url="http://192.168.1.169:8000/routers/mikrotik/ping?nas_id=NAS_MIKROTIK_ID_18" mode=http keep-result=no
}

/system scheduler add name="Run_CloudPing" interval=1m start-time=startup on-event="/system script run CloudPing"

/system script add name="CloudPing" source={
    /tool fetch url="http://192.168.1.169:8000/routers/mikrotik/ping?nas_id=mikrotik-vbox-01" mode=http keep-result=no
}

/system script run CloudPing

/system scheduler add name="Run_CloudPing" interval=1m start-time=startup on-event="/system script run CloudPing",

postgres:pg_restore --no-owner --no-privileges -d "" local_backup.dump

pg_restore --no-owner --no-privileges -d "YOUR_RENDER_EXTERNAL_DATABASE_URL" local_backup.dump
