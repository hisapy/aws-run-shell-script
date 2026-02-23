# AWS Run Shell Script

![Linter](https://github.com/hisapy/aws-run-shell-script/actions/workflows/linter.yml/badge.svg)
![CI](https://github.com/hisapy/aws-run-shell-script/actions/workflows/ci.yml/badge.svg)
![Check dist/](https://github.com/hisapy/aws-run-shell-script/actions/workflows/check-dist.yml/badge.svg)
![CodeQL](https://github.com/hisapy/aws-run-shell-script/actions/workflows/codeql-analysis.yml/badge.svg)
![Coverage](./badges/coverage.svg)

> This repo has been created from the repo template
> [https://github.com/actions/typescript-action](https://github.com/actions/typescript-action)

Use this GitHub Action to run a shell script in a AWS managed instance and wait
for the result and output.

Internally, this calls AWS Systems Manger (SSM) SendCommand using the
"AWS-RunShellScript" SSM document.

> NOTICE: Only tested in AL2023 AMI.

TODO:

- Maybe support more options from AWS SSM SendCommand
- Maybe support multiple instances
- Improve testing for different/similar AMIs

## Usage

Prequisites:

- SSM Agent installed in the instance
- A Role with permissions to execute shell commands via the `AWS-RunShellScript`
  attached to the instance, e.g.,
  `arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore`

Then in your GitHub Actions workflow:

```yaml
name: Deploy

permissions:
  contents: read
  id-token: write

jobs:
  deploy:
    name: Deploy Webapp
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v5.0.0
        with:
          role-to-assume: ${{ secrets.AWS_ROLE }}
          aws-region: ${{ inputs.aws_region }}

      - name: Pull repo
        uses: hisapy/aws-run-shell-script@v0.0.1
        with:
          instance_id: ${{ inputs.instance_id }}
          user: 'ec2-user'
          command: 'cd ~/webapp && git pull origin main'
          comment: 'Git pull repository'
      - name: Check previous command status
        run: echo ${{ steps.send.outputs.command_id }}
```

For CI or smoke tests where AWS credentials are not available, set
`dry_run: true` to skip the AWS SSM call and return mock success outputs.

## Development

After you've cloned the repository to your local machine or codespace, you'll
need to perform some initial setup steps before you can develop your action.

> [!NOTE]
>
> If you are using a version manager like
> [`nodenv`](https://github.com/nodenv/nodenv) or [`asdf`](https://asdf-vm.com)
> (configured with legacy_version_file=yes), this repo has a `.node-version`
> file at the root of the repository that can be used to automatically switch to
> the correct version when you `cd` into the repository. Additionally, this
> `.node-version` file is used by GitHub Actions in any `actions/setup-node`
> actions.

1. :hammer_and_wrench: Install the dependencies

   ```bash
   npm install
   ```

1. :building_construction: Package the TypeScript for distribution

   ```bash
   npm run bundle
   ```

1. :white_check_mark: Run the tests

   ```bash
   $ npm test

   PASS  ./index.test.js
     ✓ throws invalid number (3ms)
     ✓ wait 500 ms (504ms)
     ✓ test runs (95ms)

   ...
   ```

## Publishing a New Release

This project includes a helper script, [`script/release`](./script/release)
designed to streamline the process of tagging and pushing new releases for
GitHub Actions.

GitHub Actions allows users to select a specific version of the action to use,
based on release tags. This script simplifies this process by performing the
following steps:

1. **Retrieving the latest release tag:** The script starts by fetching the most
   recent SemVer release tag of the current branch, by looking at the local data
   available in your repository.
1. **Prompting for a new release tag:** The user is then prompted to enter a new
   release tag. To assist with this, the script displays the tag retrieved in
   the previous step, and validates the format of the inputted tag (vX.X.X). The
   user is also reminded to update the version field in package.json.
1. **Tagging the new release:** The script then tags a new release and syncs the
   separate major tag (e.g. v1, v2) with the new release tag (e.g. v1.0.0,
   v2.1.2). When the user is creating a new major release, the script
   auto-detects this and creates a `releases/v#` branch for the previous major
   version.
1. **Pushing changes to remote:** Finally, the script pushes the necessary
   commits, tags and branches to the remote repository. From here, you will need
   to create a new release in GitHub so users can easily reference the new tags
   in their workflows.

## Dependency License Management

This repo includes a GitHub Actions workflow,
[`licensed.yml`](./.github/workflows/licensed.yml), that uses
[Licensed](https://github.com/licensee/licensed) to check for dependencies with
missing or non-compliant licenses. This workflow is initially disabled. To
enable the workflow, follow the below steps.

1. Open [`licensed.yml`](./.github/workflows/licensed.yml)
1. Uncomment the following lines:

   ```yaml
   # pull_request:
   #   branches:
   #     - main
   # push:
   #   branches:
   #     - main
   ```

1. Save and commit the changes

Once complete, this workflow will run any time a pull request is created or
changes pushed directly to `main`. If the workflow detects any dependencies with
missing or non-compliant licenses, it will fail the workflow and provide details
on the issue(s) found.

### Updating Licenses

Whenever you install or update dependencies, you can use the Licensed CLI to
update the licenses database. To install Licensed, see the project's
[Readme](https://github.com/licensee/licensed?tab=readme-ov-file#installation).

To update the cached licenses, run the following command:

```bash
licensed cache
```

To check the status of cached licenses, run the following command:

```bash
licensed status
```
