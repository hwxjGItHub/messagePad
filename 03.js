var express = require('express');
var app = express();
var mongodb = require('mongodb');
var mongodbClient = mongodb.MongoClient;
var formidable = require("formidable");//post 表单提交

var objectId = require('mongodb').ObjectID

// 数据库访问地址，访问数据库名称
var url = "mongodb://localhost:27017";

app.set('view engine', 'ejs');

app.use(express.static('./public/'));//引入静态文件

//  访问页面
app.get('/', function (req, res) {
    // 计算分页 的条数
    getAllCout('message', function (num){
        // console.log(num)
        res.render('index',{
            "pagecount": Math.ceil(num/3) // 每页条数
        })
    })

    // mongodbClient.connect(url, function (err, db) {
    //     if (err) {
    //         console.log('数据库连接失败')
    //     }
    //     var dbo = db.db('test');
    //     let result = []
    //     var cursor = dbo.collection('message').find();
    //     cursor.each(function (err, data) {
    //         if (err) {
    //             return;
    //         }
    //         if (data != null) {
    //             result.push(data);
    //         } else {
    //             db.close();//关闭数据库
    //             res.render('index', {
    //                 'result': result
    //             })
    //         }
    //     })
    // })
})

// 提交进数据库
app.post("/tijiao", function (req, res) {

    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {

        mongodbClient.connect(url, function (err, db){
            if(err){
                console.log('数据库连接失败');
                return;
            }
            var dbname = db.db('test'); // 数据库名称

            // 将数据添加进数据库，调用数据库的方法
            dbname.collection('message').insertOne({ 'name': fields.name, 'message': fields.message, 'times': new Date().toLocaleString() },function(err,result){
                var id = result.ops[0]._id.toString(); // 获取唯一的id号
                if(err){
                    res.json({'result': -1}) // 代表添加数据失败
                    return;
                }
                // 成功就返回添加成功
                res.json({ 'result': 1, 'id': id})
                
                res.end();
                // 关闭数据库
                db.close();
            })

        })
    });
})

// 页码点击
app.get('/getData',function(req,res){
    var page = parseInt(req.query.page)

    var result = [];
    // cursor.skip()游标上的方法来控制MongoDB开始返回结果的位置。
    // limit()数据库返回数据数量
    // sort()排序： age字段的降序排序 ，然后按posts字段按升序
    mongodbClient.connect(url, function (err, db) {
        if (err) {
            console.log("数据库连接失败");
            return;
        }
        var cursor = db.db('test').collection('message').find().skip((page -1)*3).limit(3).sort({times:-1});

        cursor.each(function (err, doc) {
            if (err) {
                callback(err, null);
                return;
            }
            if (doc != null) {
                result.push(doc);
                
            } else {
                res.json(result)
                db.close();
            }
        })

    });
})


// 删除操作
app.get('/deleteData',function(req,res){
    var delid = objectId(req.query.id);
    // mongodbClient.connect(url, function (err, db) {
    //     if (err) {
    //         console.log("数据库连接失败");
    //         return;
    //     }
    //     db.db('test').collection('message').deleteMany({_id: id}, function(err,result){
    //         if (err) {
    //             res.json({ 'result': -1 }) // 代表添加数据失败
    //             return;
    //         }
    //         // 成功就返回添加成功
    //         res.json({ 'result': 1})
    //         db.close();
    //     })
    // });
    deleteMany("message", {_id: delid}, function(err,result) {
        if (err) {
            res.json({ 'result': -1 }) // 代表添加数据失败
            return;
        }
        // 成功就返回添加成功
        res.json({ 'result': 1})
    })

})


function _connectDB(callback) {
    mongodbClient.connect(url, function (err, db) {
        if (err) {
            callback(err, null)
            return;
        }
        callback(err, db);  // 增删该查
    })
}

function deleteMany(set, json, callback) {
    if(!json) {
        return;
    }
    _connectDB(function(err,db) {
        
        db.db('test').collection(set).deleteMany(json, function (err, result) {
            // 成功就返回添加成功
            callback(err, result);
            db.close();
        })
    })
   
}

// 条数的方法
function getAllCout(collection, callback) {
    _connectDB(function (err, db) { // count游标
        db.db("test").collection(collection).count({}).then(function(count) {
            callback(count);
            db.close();
        })
    })
}



app.listen('3000')