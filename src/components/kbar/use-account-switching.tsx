import { api } from "@/trpc/react"
import { useRegisterActions } from "kbar"
import { useLocalStorage } from "usehooks-ts"

const useAccountSwitching = () => {
    const {data: accounts} = api.account.getAccounts.useQuery()

    const mainAction = [
        {
            id: "accountsAction",
            name: "Switch Account",
            shortcut: ["s", "s"],
            keywords: "switch, account",
            section: "Accounts",
            subtitle: "Switch between your accounts",
        },
    ]

    const [_, setAccountId] = useLocalStorage("accountId", "")

    useRegisterActions(mainAction.concat((accounts?.map((account, index) => {
        return {
            id: account.id,
            name: account.name,
            parent: 'accountsAction',
            perform: () => {
                setAccountId(account.id)
            },
            keywords: [
                account.name,
                account.emailAddress,
                "switch",
                "account"
            ].filter(Boolean).join(" "),
            shortcut: [],
            section: "Accounts",
            subtitle: account.emailAddress,
        }
    })) || []), [accounts])
}

export default useAccountSwitching