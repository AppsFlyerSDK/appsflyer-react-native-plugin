JIRA_TOKEN=$1
JIRA_FIXED_VERSION=$2

fixed_version_found=false
curl -X GET -H "Authorization: Basic $JIRA_TOKEN=" https://appsflyer.atlassian.net/rest/api/3/project/11723/versions | jq -r '.[] | .name+""+.id' | while read version ; do
if [[ "$version" == *"$JIRA_FIXED_VERSION"* ]] ;then
    echo "$JIRA_FIXED_VERSION Found!"
    fixed_version_found=true
    version_id=${version#"$JIRA_FIXED_VERSION"}
    echo $(curl -X GET -H "Authorization: Basic $JIRA_TOKEN=" https://appsflyer.atlassian.net/rest/api/3/search?jql=fixVersion=$version_id | jq -r '.issues[] | "- " + .fields["summary"]+"@"') > "$JIRA_FIXED_VERSION-releasenotes".txt
    sed -i -r -e "s/@ /\n/gi" "$JIRA_FIXED_VERSION-releasenotes".txt
    sed -i -r -e "s/@/\n/gi" "$JIRA_FIXED_VERSION-releasenotes".txt
    cat "$JIRA_FIXED_VERSION-releasenotes".txt
fi
done
if [ fixed_version_found == false ];then
echo "$JIRA_FIXED_VERSION is not found!"
exit 1
fi