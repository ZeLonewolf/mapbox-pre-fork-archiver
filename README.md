# mapbox-pre-fork-archiver

Store pre-copyright mapbox issue repository data

Procedure:

1. Obtain a GitHub access key
2. Run `npm install`
3. Run `node archive.js <access key> 2>&1 | tee -a audit.log`

Archived issues are stored in JSON format in the `archive` folder.

Note that GitHub has a 15,000 request per hour limit, so an archive operation may need to be spread over time. The script will skip issues it has previously archived.