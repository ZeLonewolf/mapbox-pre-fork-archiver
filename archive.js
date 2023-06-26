//Usage:
//node index.js <github access key>

import { Octokit } from "octokit";
import fs from "fs";

const cutoffDate = new Date("2020-12-08");

// Authenticate with GitHub using a personal access token
const octokit = new Octokit({ auth: process.argv[2] });

// Specify the repository details
const repositories = [
  ["mapbox", "mapbox-gl-js"],
  ["mapbox", "mapbox-gl-native"],
];

// Helper function to write data to a JSON file
function writeJSONFile(filename, data) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}

// Function to archive issues and their comments
async function archiveIssues(owner, repo) {
  console.log(`📘 Repository ${owner}/${repo}`);
  try {
    let page = 1;
    while (true) {
      // Fetch all issues from the repository
      const { data: issues } = await octokit.request(
        `GET /repos/${owner}/${repo}/issues?page=${page}`,
        {
          owner,
          repo,
          state: "all",
        }
      );
      if (issues.length == 0) {
        break;
      }
      console.log(` 📄 Page ${page} issues`);
      // Filter issues created before December 8, 2020
      const filteredIssues = issues.filter((issue) => {
        let issueOK =
          new Date(issue.created_at) < cutoffDate &&
          new Date(issue.updated_at) < cutoffDate;
        console.log(
          `#${issue.number} 📄${issue.created_at} 📝${issue.updated_at} ${
            issueOK ? "✅" : "🚫"
          }`
        );
        return issueOK;
      });

      // Fetch and archive comments for each filtered issue
      for (const issue of filteredIssues) {
        const issueFileName = `archive/${owner}/${repo}/issue-${issue.number}.json`;
        if (fs.existsSync(issueFileName)) {
          continue;
        }
        issue.comments = [];
        let commentPage = 1;
        while (true) {
          const { data: comments } = await octokit.request(
            `GET /repos/${owner}/${repo}/issues/${issue.number}/comments?page=${commentPage}`,
            {
              owner,
              repo,
              issue_number: issue.number,
            }
          );

          if (comments.length == 0) {
            break;
          }
          console.log(` 💬📄 Page ${commentPage} comments`);

          // Filter comments posted before December 8, 2020
          const filteredComments = comments.filter((comment) => {
            // new Date(comment.created_at) < cutoffDate;
            let issueOK =
              new Date(comment.created_at) < cutoffDate &&
              new Date(comment.updated_at) < cutoffDate;
            console.log(
              ` 💬 ${issue.number}:${comment.id} 📄${comment.created_at} 📝${
                comment.updated_at
              } ${issueOK ? "✅" : "🚫"}`
            );
            return issueOK;
          });

          // Append the filtered comments array to the issue object
          issue.comments.push(...filteredComments);
          ++commentPage;
        }
        // Write the issue and comments to a JSON file
        fs.mkdirSync(`archive/${owner}/${repo}/`, { recursive: true });
        writeJSONFile(issueFileName, issue);
      }
      ++page;
    }
    console.log("Archive complete!");
  } catch (error) {
    console.error("Error archiving issues:", error);
  }
}

// Call the main function to start the archiving process
for (let i in repositories) {
  await archiveIssues(repositories[i][0], repositories[i][1]);
}
