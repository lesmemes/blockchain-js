import { ProgramState } from './model'
import { Injectable } from '@angular/core'
import * as SupplyChainAdapter from '../supply-chain-adapter'
import * as Blockchain from 'blockchain-js-core'

const IDENTITY_REGISTRY_CONTRACT_ID = "identity-registry-1"
const SUPPLY_CHAIN_CONTRACT_ID = "supply-chain-v1"
//const RANDOM_GENERATOR_CONTRACT_ID = "random-generator-v1"

/**
 * Application state
 */
@Injectable()
export class State {
    logs: string[] = []

    log(message) {
        this.logs.unshift(message)
        if (this.logs.length > 20)
            this.logs.pop()
    }

    userStarted() { return this.user != null }

    user: {
        pseudo: string
        comment: string
        keys: {
            privateKey: string;
            publicKey: string;
        }
    } = null

    currentHead = ''

    hasSupplyChainAccount = false

    async setPseudo(pseudo: string, comment: string) {
        if (!pseudo) // TODO better check
            return

        if (this.user)
            throw `error user already set`

        this.user = {
            pseudo: pseudo.indexOf('@') >= 0 ? pseudo : `${pseudo}@blockchain-js.com`,
            comment,
            keys: null
        }
    }

    fullNode: Blockchain.FullNode.FullNode = null

    _selectedBranch = Blockchain.Block.MASTER_BRANCH

    get selectedBranch() {
        return this._selectedBranch
    }

    set selectedBranch(branch: string) {
        this._selectedBranch = branch
        this.messageSequence.setBranch(branch)
    }

    localMining = true

    state: {
        [key: string]: {
            branch: string
            head: string
            blocks: any[]
        }
    } = { "master": { branch: Blockchain.Block.MASTER_BRANCH, head: null, blocks: [] } }

    messageSequence: Blockchain.SequenceStorage.SequenceStorage
    smartContract: Blockchain.SmartContract.SmartContract = null
    suppyChain: SupplyChainAdapter.SupplyChainAdapter = new SupplyChainAdapter.SupplyChainAdapter()

    // a counter to know which components are loading something
    loaders = 0

    isLoading() {
        return this.loaders > 0 || this.fullNode.transfer.isLoading()
    }

    private userKeyUpdateListener

    init(userKeyUpdateListener: () => any) {
        this.userKeyUpdateListener = userKeyUpdateListener

        this.initFullNode()

        setTimeout(() => {
            this.registerIdentity()
        }, 1000)
    }

    get branches() {
        return Object.getOwnPropertyNames(this.state)
    }

    programState: ProgramState = null



    private nextLoad: { branch, blockId } = { branch: null, blockId: null }
    private lastLoaded = { branch: null, blockId: null }

    private messages = []

    hasIdentityContract = false
    registeredOnIdentityContract = false

    callContract = async (contractUuid, iterationId, method, account, data) => {
        if (this.smartContract.hasContract(contractUuid)) {
            data.email = account.email
            let callId = await this.smartContract.callContract(contractUuid, iterationId, method, account ? Blockchain.HashTools.signAndPackData(data, account.keys.privateKey) : data)
            return await waitReturn(this.smartContract, callId)
        }

        return false
    }

    supplyChainCall = async (method, account, data) => this.callContract(SUPPLY_CHAIN_CONTRACT_ID, 0, method, account, data)

    minerHook: Blockchain.MinerApi.MinerApi = {
        addData: (branch: string, data: any) => {
            this.log(`intercepted mining on branch ${branch}, use local ? ${this.localMining}`)
            if (this.localMining)
                this.localMiner.addData(branch, data)
            else {
                console.log(`NOBODY TO MINE THIS !!! SHOULD RPC TO THE SERVER !!!`, data)
            }
        }
    }

    private localMiner: Blockchain.MinerImpl.MinerImpl = null

    private initFullNode() {
        this.fullNode = new Blockchain.FullNode.FullNode()
        this.localMiner = new Blockchain.MinerImpl.MinerImpl(this.fullNode.node)

        setInterval(() => {
            if (this.lastLoaded.blockId != this.nextLoad.blockId || this.lastLoaded.branch != this.nextLoad.branch) {
                this.lastLoaded = { branch: this.nextLoad.branch, blockId: this.nextLoad.blockId }
                this.loadState(this.lastLoaded.branch, this.lastLoaded.blockId)
            }
        }, 500)

        this.fullNode.node.addEventListener('head', async (event) => {
            //this.log(`new head on branch '${event.branch}': ${event.headBlockId.substr(0, 7)}`)
            this.triggerLoad(event.branch, event.headBlockId)
            this.currentHead = event.headBlockId.substr(0, 7)
        })

        this.messageSequence = new Blockchain.SequenceStorage.SequenceStorage(
            this.fullNode.node,
            this.selectedBranch,
            `demo-chat-v1`,
            this.fullNode.miner)
        this.messageSequence.initialise()

        this.messageSequence.addEventListener('change', (sequenceItemsByBlock) => this.updateStatusFromSequence(sequenceItemsByBlock))

        this.smartContract = new Blockchain.SmartContract.SmartContract(this.fullNode.node, Blockchain.Block.MASTER_BRANCH, 'people', this.fullNode.miner)
        this.smartContract.addChangeListener(() => this.programState = JSON.parse(JSON.stringify(this.suppyChain.getSuppyChainState())))
        this.smartContract.initialise()

        this.suppyChain.setSmartContract(this.smartContract)
    }

    private updateStatusFromSequence(sequenceItemsByBlock: { blockId: string; items: Blockchain.SequenceStorage.SequenceItem[] }[]) {
        this.messages = []

        for (let idx = 0; idx < sequenceItemsByBlock.length; idx++) {
            let { items } = sequenceItemsByBlock[idx]
            this.messages = this.messages.concat(items)
        }

        this.messages = this.messages.reverse()
    }

    private triggerLoad(branch: string, blockId: string) {
        this.nextLoad = { branch, blockId }
    }

    private async loadState(branch: string, blockId: string) {
        if (this.state && this.state[branch] && this.state[branch].head == blockId)
            return

        // only update current state
        // stop when we encounter the current branch head
        // if not found, replace the head

        let state = {}

        let toFetch = blockId

        let branchState = {
            branch: branch,
            head: toFetch,
            blocks: []
        }

        let toFetchs = [toFetch]
        while (toFetchs.length) {
            let fetching = toFetchs.shift()

            let blockMetadatas = await this.fullNode.node.blockChainBlockMetadata(fetching, 1)
            let blockMetadata = blockMetadatas && blockMetadatas[0]
            let blockDatas = await this.fullNode.node.blockChainBlockData(fetching, 1)
            let blockData = blockDatas && blockDatas[0]

            branchState.blocks.push({ blockMetadata, blockData })

            blockData && blockData.previousBlockIds && blockData.previousBlockIds.forEach(b => !toFetchs.some(bid => bid == b) && toFetchs.push(b))
        }

        state[branch] = branchState

        this.state = state
    }

    private async registerIdentity() {
        let callLater = true

        if (this.isLoading()) {
            console.log(`registerIdentity : wait loading finished`)
        }
        else if (!this.user) {
            console.log(`registerIdentity : wait user presence`)
        }
        else if (!this.hasIdentityContract) {
            console.log(`registerIdentity : wait identity contract`)
            this.checkIdentityContract()
        }
        else if (!this.registeredOnIdentityContract) {
            console.log(`registerIdentity : wait identity contract registration`)
            await this.registerIdentityImpl()
        }
        else if (!this.hasSupplyChainAccount) {
            console.log(`registerIdentity : wait supply chain account`)
            await this.registerAccount()
        }
        else {
            this.log(`all done for identity registration`)
            callLater = false
        }

        if (callLater)
            setTimeout(() => this.registerIdentity(), 1000)
    }

    private async registerAccount() {
        this.log(`registering account on supply chain...`)
        let account = {
            keys: this.user.keys,
            email: this.user.pseudo
        }

        if (!await this.suppyChain.hasAccount(account.email))
            await this.suppyChain.createAccount(account)
        else
            this.log(`already registered on supplychain`)

        this.hasSupplyChainAccount = true
    }

    private checkIdentityContract() {
        this.hasIdentityContract = this.smartContract.hasContract(IDENTITY_REGISTRY_CONTRACT_ID)
    }

    private async registerIdentityImpl(): Promise<boolean> {
        if (!this.user)
            return

        console.log(`registering identity`)

        if (!this.user.keys) {
            this.user.keys = await Blockchain.HashTools.generateRsaKeyPair()
            this.userKeyUpdateListener()
        }

        if (!this.hasIdentityContract) {
            this.log(`no identity registry contract installed (${IDENTITY_REGISTRY_CONTRACT_ID})`)
            return
        }

        let identityContractState = this.smartContract.getContractState(IDENTITY_REGISTRY_CONTRACT_ID)
        if (!identityContractState) {
            this.log(`no identity contract state`)
            return
        }

        if (identityContractState.identities[this.user.pseudo]) {
            this.log(`already registered identity ${this.user.pseudo}`)
            this.registeredOnIdentityContract = true
            return
        }

        let account = {
            keys: this.user.keys,
            email: this.user.pseudo
        }
        if (! await this.callContract(IDENTITY_REGISTRY_CONTRACT_ID, 0, 'registerIdentity', account, {
            comment: `${this.user.comment}`
        })) {
            this.log(`failed to register identity`)
            return
        }

        console.log(`identity registered with email ${account.email}`)
        this.registeredOnIdentityContract = true
    }
}

async function waitReturn(smartContract, callId) {
    await waitUntil(() => smartContract.hasReturnValue(callId))
    return smartContract.getReturnValue(callId)
}

async function waitUntil(condition: () => Promise<boolean>) {
    while (!await condition())
        await wait(50)
}

function wait(duration: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), duration)
    })
}