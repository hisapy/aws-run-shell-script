import * as core from '@actions/core'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
import {
  GetCommandInvocationCommand,
  SSMClient,
  SendCommandCommand,
  Command
} from '@aws-sdk/client-ssm'

interface Inputs {
  instanceId: string
  workingDirectory: string
  command: string
  comment: string
  user: string
  timeoutSeconds: number
}

interface Outputs {
  commandId: string
  commandStatus: string
  commandOutput?: string
}

export async function run(): Promise<void> {
  try {
    const inputs: Inputs = {
      instanceId: core.getInput('instance_id', { required: true }),
      workingDirectory: core.getInput('working_directory'),
      command: core.getInput('command', { required: true }),
      comment: core.getInput('comment'),
      user: core.getInput('user'),
      timeoutSeconds: parseTimeout(
        core.getInput('timeout'),
        core.getBooleanInput('wait_for_result')
      )
    }

    const client = new SSMClient()
    const command = await runShellScript(inputs, client)
    const outputs = await waitForResult(command!, client, inputs.timeoutSeconds)

    core.setOutput('command_id', outputs.commandId)
    core.setOutput('command_status', outputs.commandStatus)
    core.setOutput('command_output', outputs.commandOutput)

    return
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

function parseTimeout(
  timeoutRaw: string = '120',
  waitForResult: boolean = true
): number {
  if (!waitForResult) {
    return 0
  }
  const timeoutSeconds = Number.parseInt(timeoutRaw, 10)

  if (timeoutSeconds < 1) {
    throw new Error('timeout must be a positive integer')
  }

  return timeoutSeconds
}

async function runShellScript(
  input: Inputs,
  client: SSMClient
): Promise<Command | undefined> {
  const response = await client.send(
    new SendCommandCommand({
      DocumentName: 'AWS-RunShellScript',
      InstanceIds: [input.instanceId],
      TimeoutSeconds: input.timeoutSeconds,
      Parameters: {
        commands: [`sudo -u ${input.user} bash -c '${input.command}'`],
        workingDirectory: [input.workingDirectory],
        comment: [input.comment]
      }
    })
  )

  core.info(
    `SSM send command response: ${JSON.stringify(response.Command, null, 2)}`
  )

  if (response.Command?.CommandId === undefined) {
    throw new Error('Failed to get command ID from SSM response')
  }

  return response.Command
}

const TERMINAL_STATUS = new Set<string>([
  'Success',
  'Delivery Timed Out',
  'Execution Timed Out',
  'Failed',
  'Cancelled',
  'Undeliverable',
  'Terminated'
])

async function waitForResult(
  command: Command,
  client: SSMClient,
  timeoutSeconds: number
): Promise<Outputs> {
  const commandId = command.CommandId!
  const instanceId = (command.InstanceIds as string[] | undefined)?.[0]

  if (!instanceId) {
    throw new Error('InstanceId is required to wait for result')
  }

  if (timeoutSeconds < 1) {
    return {
      commandId,
      commandStatus: command.Status ?? 'Pending'
    }
  }

  const startedAt = Date.now()
  const timeoutMs = timeoutSeconds * 1000
  let delayMs = 1000

  while (Date.now() - startedAt < timeoutMs) {
    const response = await client.send(
      new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: instanceId
      })
    )

    const statusDetails = response.StatusDetails ?? 'Pending'

    if (statusDetails == 'Success') {
      return {
        commandId,
        commandStatus: statusDetails,
        commandOutput: response.StandardOutputContent
      }
    } else if (TERMINAL_STATUS.has(statusDetails)) {
      throw new Error(
        `Command ${commandId} finished with non-success status: ${statusDetails}.\nOutput: ${response.StandardErrorContent}`
      )
    }

    // Exponential backoff with a max delay of 10 seconds
    await sleep(Math.min(delayMs, 10_000))
    delayMs *= 2
  }

  throw new Error(
    `Timed out after ${timeoutSeconds}s waiting for command ${commandId} to reach a terminal status`
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
