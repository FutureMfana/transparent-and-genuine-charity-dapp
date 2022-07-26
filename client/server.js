const express = require("express");
const app = express();
const http = require("http").createServer(app);
const cors = require("cors");
const sql = require('mssql');
const algosdk = require("algosdk");

const baseServer = "https://testnet-algorand.api.purestake.io/idx2";
const port = "";
const PORT = 5000;

const token = {
    //API Key here
}

let indexerClient = new algosdk.Indexer(token, baseServer, port);

app.use(cors());
app.use(express.json());

//NOTE:
//accountAddressInfor.transactions[0]["inner-txns"] => RECEIVER INNER TRANSACTION => []
//accountAddressInfor.transactions[0].sender => SENDER ACCOUNT => ''
//accountAddressInfor.transactions[0].id => TRANSACTION ID => ''

const getTransaction = async(walletAddr) =>{
    let transactionsArrBulk = [];
    try {
        let accountAddressInfor = await indexerClient.lookupAccountTransactions(walletAddr).limit(25).txType("pay").do();
        let transactionsArr = accountAddressInfor.transactions;
        for (let index = 0; index < transactionsArr.length; index++) {
            //console.log(transactionsArr[index]["inner-txns"]) //[]
            if(accountAddressInfor.transactions[index]["inner-txns"] !== undefined){
                let tranxBlock = {
                    "txId": accountAddressInfor.transactions[index].id,
                    "senderAccount": accountAddressInfor.transactions[index].sender,
                    "receiverInnerTrans": accountAddressInfor.transactions[index]["inner-txns"],
                }
                transactionsArrBulk.push(tranxBlock);
            }
        }
        return transactionsArrBulk;
    } catch (error) {
        console.log(error.message)
        return;
    }
    
}

app.get("/transactions/:accountAddress",async (req,res)=>{
    let transactionsArrBulk = [];
    const accountAddress = req.params.accountAddress;
    let accountAddressInfor = await indexerClient.lookupAccountTransactions(accountAddress).limit(25).txType("pay").do();
    let transactionsArr = accountAddressInfor.transactions;
    for (let index = 0; index < transactionsArr.length; index++) {
       //console.log(transactionsArr[index]["inner-txns"]) //[]
       if(accountAddressInfor.transactions[index]["inner-txns"] !== undefined){
        let tranxBlock = {
            "txId": accountAddressInfor.transactions[index].id,
            "senderAccount": accountAddressInfor.transactions[index].sender,
            "receiverInnerTrans": accountAddressInfor.transactions[index]["inner-txns"],
        }
        transactionsArrBulk.push(tranxBlock);
       }
      
        
    }
    res.send(transactionsArrBulk); 
})

app.get("/allTransactions/:listAccountAddress",async (req,res)=>{
    let transactionsArrBulk = [];
    const listAccountAddress = req.params.listAccountAddress.split(',');
    console.log(listAccountAddress)
    for(let i = 0 ; i < listAccountAddress.length; i++){
        if(listAccountAddress[i] != ""){
            let trans = await getTransaction(listAccountAddress[i])
            transactionsArrBulk.push(...trans)
        }   
    }
    console.log(transactionsArrBulk)
    res.send(transactionsArrBulk); 
})

app.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});
