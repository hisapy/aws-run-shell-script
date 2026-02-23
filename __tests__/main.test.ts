import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)

type SsmSendMockResponse = {
  Command?: {
    CommandId?: string
    InstanceIds?: string[]
    Status?: string
  }
  StatusDetails?: string
  StandardOutputContent?: string
  StandardErrorContent?: string
}

const sendMock = jest.fn<(command: unknown) => Promise<SsmSendMockResponse>>()

const SendCommandCommandMock = jest.fn((input) => ({ input }))
const GetCommandInvocationCommandMock = jest.fn((input) => ({ input }))
const SSMClientMock = jest.fn(() => ({ send: sendMock }))

jest.unstable_mockModule('@aws-sdk/client-ssm', () => ({
  SendCommandCommand: SendCommandCommandMock,
  GetCommandInvocationCommand: GetCommandInvocationCommandMock,
  SSMClient: SSMClientMock
}))

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

const INSTANCE_ID = 'i-0123456789abcdef0'

describe('run()', () => {
  beforeEach(() => {
    sendMock.mockReset()
    SSMClientMock.mockReset()
    SSMClientMock.mockImplementation(() => ({ send: sendMock }))

    // Default inputs: wait for result enabled
    core.getInput.mockImplementation((name: string) => {
      if (name === 'instance_id') return INSTANCE_ID
      if (name === 'command') return 'echo hello'
      if (name === 'user') return 'ec2-user'
      if (name === 'timeout') return '120'
      if (name === 'working_directory') return ''
      if (name === 'comment') return ''
      return ''
    })
    core.getBooleanInput.mockImplementation((name: string) => {
      if (name === 'wait_for_result') return true
      return false
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('runs SSM command and waits for completion', async () => {
    sendMock
      .mockResolvedValueOnce({
        Command: { CommandId: 'cmd-123', InstanceIds: [INSTANCE_ID] }
      })
      .mockResolvedValueOnce({
        // GetCommandInvocation uses StatusDetails for terminal detection
        StatusDetails: 'Success',
        StandardOutputContent: 'hello\n'
      })

    await run()

    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'command_id', 'cmd-123')
    expect(core.setOutput).toHaveBeenNthCalledWith(
      2,
      'command_status',
      'Success'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      3,
      'command_output',
      'hello\n'
    )
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('sends command without waiting when wait_for_result is false', async () => {
    core.getBooleanInput.mockImplementation((name: string) => {
      if (name === 'wait_for_result') return false
      return false
    })

    sendMock.mockResolvedValueOnce({
      Command: {
        CommandId: 'cmd-999',
        InstanceIds: [INSTANCE_ID],
        Status: 'Pending'
      }
    })

    await run()

    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'command_id', 'cmd-999')
    expect(core.setOutput).toHaveBeenNthCalledWith(
      2,
      'command_status',
      'Pending'
    )
    expect(core.setOutput).toHaveBeenNthCalledWith(
      3,
      'command_output',
      undefined
    )
    expect(GetCommandInvocationCommandMock).not.toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('fails when timeout input is not a positive integer', async () => {
    core.getInput.mockImplementation((name: string) => {
      if (name === 'instance_id') return INSTANCE_ID
      if (name === 'command') return 'echo hello'
      if (name === 'user') return 'ec2-user'
      if (name === 'timeout') return '0'
      return ''
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'timeout must be a positive integer'
    )
  })

  it('does not set outputs and calls setFailed when command fails', async () => {
    sendMock
      .mockResolvedValueOnce({
        Command: { CommandId: 'cmd-456', InstanceIds: [INSTANCE_ID] }
      })
      .mockResolvedValueOnce({
        StatusDetails: 'Failed',
        StandardErrorContent: 'permission denied'
      })

    await run()

    expect(core.setOutput).not.toHaveBeenCalled()
    expect(core.setFailed).toHaveBeenCalledWith(
      'Command cmd-456 finished with non-success status: Failed.\nOutput: permission denied'
    )
  })

  it('fails and calls setFailed when the commandStatus is not success', async () => {
    sendMock
      .mockResolvedValueOnce({
        Command: { CommandId: 'cmd-789', InstanceIds: [INSTANCE_ID] }
      })
      .mockResolvedValueOnce({
        StatusDetails: 'Execution Timed Out',
        StandardErrorContent: 'timed out'
      })

    await run()

    expect(core.setOutput).not.toHaveBeenCalled()
    expect(core.setFailed).toHaveBeenCalledWith(
      'Command cmd-789 finished with non-success status: Execution Timed Out.\nOutput: timed out'
    )
  })
})
