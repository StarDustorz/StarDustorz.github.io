---
title: Linux 常用命令
date: 2021-06-12 19:29:17
tags:
  - Linux
categories:
  - Basic
published: false
toc: "true"
comments: "true"
description: 定义总结
---


## 1 一、文件和目录

> 查看路径

### 1.1 **pwd**

**显示当前目录的路径**

  

### 1.2 **which**

查看命令的可执行文件所在路径， Linux 下，每一条命令其实都对应一个可执行程序，在终端中输入命令，按回车的时候，就是执行了对应的那个程序， which 命令本身对应的程序也存在于 Linux 中。

总的来说一个命令就是一个可执行程序。

  

> _浏览和切换目录_

  

### 1.3 **ls**

**列出文件和目录，它是 Linux 最常用的命令之一。**

  

【常用参数】

- -a 显示所有文件和目录包括隐藏的
- -l 显示详细列表
- -h 适合人类阅读的
- -t 按文件最近一次修改时间排序
- -i 显示文件的 inode （ inode 是文件内容的标识）

### 1.4 **cd**

**cd 是英语 change directory 的缩写，表示切换目录。**

  

```text
cd / --> 跳转到根目录
cd ~ --> 跳转到家目录
cd .. --> 跳转到上级目录
cd ./home --> 跳转到当前目录的home目录下
cd /home/lion --> 跳转到根目录下的home目录下的lion目录
cd --> 不添加任何参数，也是回到家目录
```

[注意] 输入cd /ho + 单次 tab 键会自动补全路径 + 两次 tab 键会列出所有可能的目录列表。

### 1.5 **du**

**列举目录大小信息。**

【常用参数】

- -h 适合人类阅读的；
- -a 同时列举出目录下文件的大小信息；
- -s 只显示总计大小，不显示具体信息。

### 1.6 浏览和创建文件

  

### 1.7 **cat**

**一次性显示文件所有内容，更适合查看小的文件。**

```text
cat cloud-init.log

```

【常用参数】

- -n 显示行号。  
    

### 1.8 **less**

**分页显示文件内容，更适合查看大的文件。**

```text
less cloud-init.log

```

【快捷操作】

- 空格键：前进一页（一个屏幕）；
- b 键：后退一页；
- 回车键：前进一行；
- y 键：后退一行；
- 上下键：回退或前进一行；
- d 键：前进半页；
- u 键：后退半页；
- q 键：停止读取文件，中止 less 命令；
- = 键：显示当前页面的内容是文件中的第几行到第几行以及一些其它关于本页内容的详细信息；
- h 键：显示帮助文档；
- / 键：进入搜索模式后，按 n 键跳到一个符合项目，按 N 键跳到上一个符合项目，同时也可以输入[正则表达式](https://www.zhihu.com/search?q=%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2717297135%7D)匹配。

  

### 1.9 **head**

**显示文件的开头几行（默认是10行）**

```text
head cloud-init.log
```

【参数】

- -n 指定行数 head cloud-init.log -n 2  
    

### 1.10 **tail**

**显示文件的结尾几行（默认是10行）**

```text
tail cloud-init.log复制代码
```

【参数】

- -n 指定行数 tail cloud-init.log -n 2
- -f 会每过1秒检查下文件是否有更新内容，也可以用 -s 参数指定间隔时间 tail -f -s 4 xxx.log

  

### 1.11 **touch**

**创建一个文件**

```text
touch new_file复制代码
```

### 1.12 **mkdir**

**创建一个目录**

```text
mkdir new_folder复制代码
```

【常用参数】

- -p 递归的创建目录结构 mkdir -p one/two/three  
    

> 文件的复制和移动

### 1.13 **cp**

**拷贝文件和目录**

  
cp file file_copy --> file 是目标文件，file_copy 是拷贝出来的文件cp file one --> 把 file 文件拷贝到 one 目录下，并且文件名依然为 file

cp file one/file_copy --> 把 file 文件拷贝到 one 目录下，文件名为file_copy

cp *.txt folder --> 把当前目录下所有 txt 文件拷贝到 folder 目录下

  

【常用参数】

- -r 递归的拷贝，常用来拷贝一整个目录  
    

### 1.14 **mv**

**移动（重命名）文件或目录，与cp命令用法相似。**

  
mv file one --> 将 file 文件移动到 one 目录下

mv new_folder one --> 将 new_folder 文件夹移动到one目录下mv *.txt folder --> 把当前目录下所有 txt 文件移动到 folder 目录下mv file new_file --> file 文件重命名为 new_file

  

> 文件的删除和链接

### 1.15 **rm**

**删除文件和目录，由于 Linux 下没有回收站，一旦删除非常难恢复，因此需要谨慎操作**

  

rm new_file --> 删除 new_file 文件

rm f1 f2 f3 --> 同时删除 f1 f2 f3 3个文件

  

【常用参数】

- -i 向用户确认是否删除；
- -f 文件强制删除；
- -r 递归删除文件夹，著名的删除操作 rm -rf 。  
    

### 1.16 **ln**

**英文 Link 的缩写，表示创建链接。**

  

学习创建链接之前，首先要理解链接是什么，我们先来看看 Linux 的文件是如何存储的：

  

Linux 文件的存储方式分为3个部分，文件名、文件内容以及权限，其中文件名的列表是存储在硬盘的其它地方和文件内容是分开存放的，每个文件名通过 inode 标识绑定到文件内容。

  

Linux 下有两种链接类型：硬链接和软链接。

  

### 1.17 硬链接

使链接的两个文件共享同样文件内容，就是同样的 inode ，一旦文件1和文件2之间有了硬链接，那么修改任何一个文件，修改的都是同一块内容，它的缺点是，只能创建指向文件的硬链接，不能创建指向目录的（其实也可以，但比较复杂）而软链接都可以，**因此软链接使用更加广泛**。

  

这个部分暂时不展开。  

## 2 二、用户与权限

  

> 用户

Linux 是一个多用户的操作系统。在 Linux 中，理论上来说，我们可以创建无数个用户，但是这些用户是被划分到不同的群组里面的，有一个用户，名叫 root ，是一个很特殊的用户，它是超级用户，拥有最高权限。

  

### 2.1 **sudo**

**以 root 身份运行命令**

  

### 2.2 **useradd + passwd**

- useradd 添加新用户
- passwd 修改用户密码

这两个命令需要 root 用户权限

  

### 2.3 **userdel**

**删除用户，需要 root 用户权限**

  

### 2.4 **su**

**切换用户**，需要 root 用户权限

  

> 群组的管理

Linux 中每个用户都属于一个特定的群组，如果你不设置用户的群组，默认会创建一个和它的用户名一样的群组，并且把用户划归到这个群组。

### 2.5 **groupadd**

**创建群组，**用法和 useradd 类似

  

### 2.6 **groupdel**

**删除一个已存在的群组**

  

### 2.7 **groups**

**查看用户所在群组**

  

### 2.8 **usermod**

**用于修改用户的账户。**

  

【常用参数】

- -l 对用户重命名。需要注意的是 /home 中的用户家目录的名字不会改变，需要手动修改。
- -g 修改用户所在的群组，例如 usermod -g friends lion修改 lion 用户的群组为 friends 。
- -G 一次性让用户添加多个群组，例如 usermod -G friends,foo,bar lion 。
- -a -G 会让你离开原先的群组，如果你不想这样做的话，就得再添加 -a 参数，意味着append 追加的意思。  
    

### 2.9 **chgrp**

**用于修改文件的群组。**

  

### 2.10 **chown**

**改变文件的所有者**，需要 root 身份才能运行。

  

【常用参数】

- -R 递归设置子目录和子文件， chown -R lion:lion /home/frank 把 frank 文件夹的用户和群组都改为 lion 。

  

> 文件权限管理

  

### 2.11 **chmod**

**修改访问权限。**

  

【常用参数】

- -R 可以递归地修改文件访问权限，例如 chmod -R 777 /home/lion

  

其中 drwxr-xr-x 表示文件或目录的权限。让我们一起来解读它具体代表什么？

- d ：表示目录，就是说这是一个目录，普通文件是 - ，链接是 l 。
- r ：read 表示文件可读。
- w ：write 表示文件可写，一般有写的权限，就有删除的权限。
- x ：execute 表示文件可执行。
- - ：表示没有相应权限。

  

现在再来理解这句权限 drwxr-xr-x 的意思：

  

- 它是一个文件夹；
- 它的所有者具有：读、写、执行权限；
- 它的群组用户具有：读、执行的权限，没有写的权限；
- 它的其它用户具有：读、执行的权限，没有写的权限。  
    

现在理解了权限，我们使用 chmod 来尝试修改权限。chmod 它不需要是 root 用户才能运行的，只要你是此文件所有者，就可以用 chmod 来修改文件的访问权限。

![](https://pic1.zhimg.com/80/v2-419fd37f2018837b1ffd75925e24901e_1440w.webp?source=1940ef5c)

chmod 640 hello.c

# 分析

6 = 4 + 2 + 0 表示所有者具有 rw 权限

4 = 4 + 0 + 0 表示群组用户具有 r 权限

0 = 0 + 0 + 0 表示其它用户没有权限

对应文字权限为：-rw-r-----

  

### 0.1 用字母来分配权限

- u ：user 的缩写，用户的意思，表示所有者。
- g ：group 的缩写，群组的意思，表示群组用户。
- o ：other 的缩写，其它的意思，表示其它用户。
- a ：all 的缩写，所有的意思，表示所有用户。
- + ：加号，表示添加权限。
- - ：减号，表示去除权限。
- = ：等于号，表示分配权限。

  
chmod u+rx file --> 文件file的所有者增加读和运行的权限

chmod g+r file --> 文件file的群组用户增加读的权限

chmod o-r file--> 文件file的其它用户移除读的权限

chmod g+r file --> 文件file的群组用户增加读的权限，其它用户移除读的权限

chmod go-r file --> 文件file的群组和其他用户移除读的权限

chmod +x file --> 文件file的所有用户增加运行的权限

chmod u=rwx,g=r,o=- file --> 文件file的所有者分配读写和执行的权限，群组其它用户分配读的权限，其他用户没有任何权限

  

## 1 三、查找文件

  

### 1.1 **locate**

**搜索包含关键字的所有文件和目录。后接需要查找的文件名，也可以用正则表达式。**

  

### 1.2 安装 locate

```text
yum -y install mlocate --> 安装包updatedb --> 更新数据库复制代码locate file.txtlocate fil*.txt
```

  

[注意] locate 命令会去[文件数据库](https://www.zhihu.com/search?q=%E6%96%87%E4%BB%B6%E6%95%B0%E6%8D%AE%E5%BA%93&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2717297135%7D)中查找命令，而不是全磁盘查找，因此刚创建的文件并不会更新到数据库中，所以无法被查找到，可以执行 updatedb 命令去更新数据库。

  

> find

  

用于查找文件，它会去遍历你的实际硬盘进行查找，而且它允许我们对每个找到的文件进行后续操作，功能非常强大。

```text
find <何处> <何物> <做什么>
```

- 何处：指定在哪个目录查找，此目录的所有子目录也会被查找。
- 何物：查找什么，可以根据文件的名字来查找，也可以根据其大小来查找，还可以根据其最近访问时间来查找。
- 做什么：找到文件后，可以进行后续处理，如果不指定这个参数， find 命令只会显示找到的文件。  
    

### 1.3 **根据文件名查找**

  
find -name "file.txt" --> 当前目录以及子目录下通过名称查找文件

find . -name "syslog" --> 当前目录以及子目录下通过名称查找文件

find / -name "syslog" --> 整个硬盘下查找syslog

find /var/log -name "syslog" --> 在指定的目录/var/log下查找syslog文件find /var/log -name "syslog*" --> 查找syslog1、syslog2 ... 等文件，通配符表示所有

find /var/log -name "*syslog*" --> 查找包含syslog的文件

[注意] find 命令只会查找完全符合 "何物" 字符串的文件，而 locate 会查找所有包含关键字的文件。

  

### 1.4 **根据文件大小查找**

  
find /var -size +10M --> /var 目录下查找文件大小超过 10M 的文件

find /var -size -50k --> /var 目录下查找文件大小小于 50k 的文件

find /var -size +1G --> /var 目录下查找文件大小查过 1G 的文件

find /var -size 1M --> /var 目录下查找文件大小等于 1M 的文件

  

### 1.5 **根据文件最近访问时间查找**

  

find -name "*.txt" -atime -7

--> 近 7天内访问过的.txt结尾的文件

### 1.6 **仅查找目录或文件,根据类型查找**

  

find . -name "file" -type f

--> 只查找当前目录下的file文件

find . -name "file" -type d

--> 只查找当前目录下的file目录

  

> 软件仓库

  

Linux 下软件是以包的形式存在，一个软件包其实就是软件的所有文件的压缩包，是二进制的形式，包含了安装软件的所有指令。Red Hat 家族的软件包后缀名一般为 .rpm ，Debian 家族的软件包后缀是 .deb 。

  

Linux 的包都存在一个仓库，叫做软件仓库，它可以使用 yum 来管理软件包， yum 是 CentOS 中默认的包管理工具，适用于 Red Hat 一族。可以理解成 Node.js 的 npm 。

  

> yum 常用命令

- yum update | yum upgrade 更新软件包
- yum search xxx 搜索相应的软件包
- yum install xxx 安装软件包
- yum remove xxx 删除软件包

  

## 2 四、文本操作

  

> grep

**全局搜索一个正则表达式，并且打印到屏幕。简单来说就是，在文件中查找关键字，并显示关键字所在行。**

### 2.1 基础语法

```text
grep text file # text代表要搜索的文本，file代表供搜索的文件
```

  

### 2.2 常用参数

- -i 忽略大小写， grep -i path /etc/profile
- -n 显示行号，grep -n path /etc/profile
- -v 只显示搜索文本不在的那些行，grep -v path /etc/profile
- -r 递归查找， grep -r hello /etc ，Linux 中还有一个 rgrep 命令，作用相当于 grep -r

### 2.3 sort

**对文件的行进行排序。**

### 2.4 基础语法

```text
sort name.txt # 对name.txt文件进行排序
```

### 2.5 实例用法

为了演示方便，我们首先创建一个文件 name.txt ，放入以下内容：

```text
ChristopherShawnTedRockNoahZacharyBella
```

  

执行 sort name.txt 命令，会对文本内容进行排序。

### 2.6 常用参数

- -o 将排序后的文件写入新文件， sort -o name_sorted.txt name.txt ；
- -r 倒序排序， sort -r name.txt ；
- -R 随机排序， sort -R name.txt ；
- -n 对数字进行排序，默认是把数字识别成字符串的，因此 138 会排在 25 前面，如果添加了 -n 数字排序的话，则 25 会在 138 前面。

  

### 2.7 wc

**word count 的缩写，用于文件的统计。它可以统计单词数目、行数、字符数，字节数等。**

### 2.8 基础语法

```text
wc name.txt # 统计name.txt
```

### 2.9 实例用法

```text
[root@lion ~]# wc name.txt 13 13 91 name.txt
```

- 第一个13，表示行数；
- 第二个13，表示单词数；
- 第三个91，表示字节数。

### 2.10 常用参数

- -l 只统计行数， wc -l name.txt ；
- -w 只统计单词数， wc -w name.txt ；
- -c 只统计字节数， wc -c name.txt ；
- -m 只统计字符数， wc -m name.txt 。  
    

### 2.11 uniq

**删除文件中的重复内容。**

### 2.12 基础语法

uniq name.txt # 去除name.txt重复的行数，并打印到屏幕上

【注意】它只能去除连续重复的行数。

  

### 2.13 常用参数

- -c 统计重复行数， uniq -c name.txt ；
- -d 只显示重复的行数， uniq -d name.txt 。  
    

### 2.14 **cut**

**剪切文件的一部分内容。**

### 2.15 基础语法

```text
cut -c 2-4 name.txt # 剪切每一行第二到第四个字符
```

### 2.16 常用参数

- -d 用于指定用什么分隔符（比如逗号、分号、双引号等等） cut -d , name.txt ；
- -f 表示剪切下用分隔符分割的哪一块或哪几块区域， cut -d , -f 1 name.txt 。  
    

## 3 五、重定向 管道 流

  

在 Linux 中一个命令的去向可以有3个地方：终端、文件、作为另外一个命令的入参。

命令一般都是通过键盘输入，然后输出到终端、文件等地方，它的标准用语是 stdin 、 stdout 以及 stderr 。

  

- 标准输入 stdin ，终端接收键盘输入的命令，会产生两种输出；
- 标准输出 stdout ，终端输出的信息（不包含错误信息）；
- 标准错误输出 stderr ，终端输出的错误信息。

  

### 3.1 重定向

把本来要显示在终端的命令结果，输送到别的地方（到文件中或者作为其他命令的输入）。

  

### 3.2 **输出重定向 >**

  

> 表示重定向到新的文件， cut -d , -f 1 notes.csv > name.csv ，它表示通过逗号剪切notes.csv 文件（剪切完有3个部分）获取第一个部分，重定向到 name.csv 文件。

  

我们来看一个具体示例，学习它的使用，假设我们有一个文件 notes.csv ，文件内容如下：

Mark1,951/100,很不错1Mark2,952/100,很不错2Mark3,

953/100,很不错3Mark4,954/100,很不错4Mark5,955/100,很不错5Mark6,956/100,很不错6

执行命令：cut -d , -f 1 notes.csv > name.csv 最后输出如下内容：

```text
Mark1Mark2Mark3Mark4Mark5Mark6
```

【注意】使用 > 要注意，如果输出的文件不存在它会新建一个，如果输出的文件已经存在，则会覆盖。因此执行这个操作要非常小心，以免覆盖其它重要文件。

  

### 3.3 **输出重定向 >>**

  

表示重定向到文件末尾，因此它不会像 > 命令这么危险，它是追加到文件的末尾（当然如果文件不存在，也会被创建）。

  

再次执行 cut -d , -f 1 notes.csv >> name.csv ，则会把名字追加到 name.csv 里面。

```text
Mark1Mark2Mark3Mark4Mark5Mark6Mark1Mark2Mark3Mark4Mark5Mark6
```

我们平时读的 log 日志文件其实都是用这个命令输出的。

  

### 3.4 **输出重定向 2>**

  

标准错误输出

```text
cat not_exist_file.csv > res.txt 2> errors.log
```

- 当我们 cat 一个文件时，会把文件内容打印到屏幕上，这个是标准输出；
- 当使用了 > res.txt 时，则不会打印到屏幕，会把标准输出写入文件 res.txt 文件中；
- 2> errors.log 当发生错误时会写入 errors.log 文件中。  
    

### 3.5 **输出重定向 2>>**

标准错误输出（追加到文件末尾）同 >> 相似。

  

  

### 3.6 **输入重定向 <**

< 符号用于指定命令的输入。

```text
cat < name.csv # 指定命令的输入为 name.csv
```

虽然它的运行结果与 cat name.csv 一样，但是它们的原理却完全不同。

  

- cat name.csv 表示 cat 命令接收的输入是 notes.csv 文件名，那么要先打开这个文件，然后打印出文件内容。
- cat < name.csv 表示 cat 命令接收的输入直接是 notes.csv 这个文件的内容， cat命令只负责将其内容打印，打开文件并将文件内容传递给 cat 命令的工作则交给终端完成。  
    

  

### 3.7 **输入重定向 <<**

  

将键盘的输入重定向为某个命令的输入。

```text
sort -n << END # 输入这个命令之后，按下回车，终端就进入键盘输入模式，其中END为结束命令（这个可以自定义）wc -m << END # 统计输入的单词复
```

### 3.8 管道 |

  

把两个命令连起来使用，一个命令的输出作为另外一个命令的输入，英文是 pipeline ，可以想象一个个水管连接起来，管道算是重定向流的一种。

  

举几个实际用法案例：

  
cut -d , -f 1 name.csv | sort > sorted_name.txt

# 第一步获取到的 name 列表，通过管道符再进行排序，最后输出到sorted_name.txt

  

du | sort -nr | head

# du 表示列举目录大小信息# sort 进行排序,-n 表示按数字排序，-r 表示倒序# head 前10行文件

  

grep log -Ir /var/log | cut -d : -f 1 | sort | uniq

# grep log -Ir /var/log 表示在log文件夹下搜索 /var/log 文本，-r 表示递归，-I 用于排除二进制文件# cut -d : -f 1 表示通过冒号进行剪切，获取剪切的第一部分# sort 进行排序# uniq 进行去重复制代码

  

## 1 六、查看进程

  

在 Windows 中通过 Ctrl + Alt + Delete 快捷键查看软件进程。

  

### 1.1 **w**

**帮助我们快速了解系统中目前有哪些用户登录着，以及他们在干什么。**

  

### 1.2 **ps**

**用于显示当前系统中的进程， ps 命令显示的进程列表不会随时间而更新，是静态的，是运行 ps 命令那个时刻的状态或者说是一个进程快照。**

  

### 1.3 常用参数

- -ef 列出所有进程;
- -efH 以乔木状列举出所有进程;
- -u 列出此用户运行的进程;
- -aux 通过 CPU 和内存使用来过滤进程 ps -aux | less ;
- -aux --sort -pcpu 按 CPU 使用降序排列， -aux --sort -pmem 表示按内存使用降序排列;
- -axjf 以树形结构显示进程， ps -axjf 它和 pstree 效果类似。  
    

### 1.4 top

**获取进程的动态列表。**

  

### 1.5 **kill**

**结束一个进程， kill + PID 。**

  

## 2 七、管理进程

  

### 2.1 进程状态

  

主要是切换进程的状态。我们先了解下 Linux 下进程的五种状态：

  

1. 状态码 R ：表示正在运行的状态；
2. 状态码 S ：表示中断（休眠中，受阻，当某个条件形成后或接受到信号时，则脱离该状态）；
3. 状态码 D ：表示不可中断（进程不响应系统异步信号，即使用kill命令也不能使其中断）；
4. 状态码 Z ：表示僵死（进程已终止，但进程描述符依然存在，直到父进程调用 wait4()[系统函数](https://www.zhihu.com/search?q=%E7%B3%BB%E7%BB%9F%E5%87%BD%E6%95%B0&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2717297135%7D)后将进程释放）；
5. 状态码 T ：表示停止（进程收到 SIGSTOP 、 SIGSTP 、 SIGTIN 、 SIGTOU 等停止信号后停止运行）。  
    

### 2.2 前台进程 & 后台进程

  

默认情况下，用户创建的进程都是前台进程，前台进程从键盘读取数据，并把处理结果输出到显示器。例如运行 top 命令，这就是一个一直运行的前台进程。

  

后台进程的优点是不必等待程序运行结束，就可以输入其它命令。在需要执行的命令后面添加& 符号，就表示启动一个后台进程。

  

### 2.3 &

启动后台进程，它的缺点是后台进程与终端相关联，一旦关闭终端，进程就自动结束了。

```text
cp name.csv name-copy.csv &
```

### 2.4 nohup

  

使进程不受挂断（关闭终端等动作）的影响。

```text
nohup cp name.csv name-copy.csv
```

nohup 命令也可以和 & 结合使用。

```text
nohup cp name.csv name-copy.csv &
```

### 2.5 bg

使一个"后台暂停运行"的进程，状态改为"后台运行"。

  

### 2.6 jobs

显示当前终端后台进程状态。

  

### 2.7 fg

fg 使进程转为前台运行，用法和 bg 命令类似。

我们用一张图来表示前后台进程切换：

  

  

![](https://pic1.zhimg.com/80/v2-fda7a2872cecb93215a9b88f9ae71a29_1440w.webp?source=1940ef5c)

  

我们可以使程序在后台运行，成为后台进程，这样在当前终端中我们就可以做其他事情了，而不必等待此进程运行结束。

  

## 3 八、文件压缩解压

  

- 打包：是将多个文件变成一个总的文件，它的学名叫存档、归档。
- 压缩：是将一个大文件（通常指归档）压缩变成一个小文件。  
    

我们常常使用 tar 将多个文件归档为一个总的文件，称为 archive 。然后用 gzip 或 bzip2 命令将 archive 压缩为更小的文件。

  

### 3.1 **tar**

**创建一个 tar 归档。**

  

### 3.2 基础用法

  
tar -cvf sort.tar sort/

# 将sort文件夹归档为sort.tar

  

tar -cvf archive.tar file1 file2 file3

# 将 file1 file2 file3 归档为archive.tar复制代码

### 0.1 常用参数

- -cvf 表示 create（创建）+ verbose（细节）+ file（文件），创建归档文件并显示操作细节；
- -tf 显示归档里的内容，并不解开归档；
- -rvf 追加文件到归档， tar -rvf archive.tar file.txt ；
- -xvf 解开归档， tar -xvf archive.tar 。

  

### 0.2 gzip / gunzip

"压缩/解压"归档，默认用 gzip 命令，压缩后的[文件后缀名](https://www.zhihu.com/search?q=%E6%96%87%E4%BB%B6%E5%90%8E%E7%BC%80%E5%90%8D&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2717297135%7D)为 .tar.gz 。

```text
gzip archive.tar # 压缩gunzip archive.tar.gz # 解压
```

### 0.3 tar 归档+压缩

可以用 tar 命令同时完成归档和压缩的操作，就是给 tar 命令多加一个选项参数，使之完成归档操作后，还是调用 gzip 或 bzip2 命令来完成压缩操作。

  
tar -zcvf archive.tar.gz archive/ # 将archive文件夹归档并压缩

tar -zxvf archive.tar.gz # 将archive.tar.gz归档压缩文件解压

  

### 0.4 zcat、zless、zmore

之前讲过使用 cat less more 可以查看文件内容，但是压缩文件的内容是不能使用这些命令进行查看的，而要使用 zcat、zless、zmore 进行查看。

zcat archive.tar.gz

  

### 0.5 zip/unzip

  

"压缩/解压" zip 文件（ zip 压缩文件一般来自 windows 操作系统）。

  

### 0.6 命令安装

```text
# Red Hat 一族中的安装方式yum install zip yum install unzip 复制代码
```

  

### 0.7 基础用法

  

unzip archive.zip

# 解压 .zip 文件

unzip -l archive.zip

# 不解开 .zip 文件，只看其中内容

zip -r sort.zip sort/

# 将sort文件夹压缩为 sort.zip，其中-r表示递归

  

### 0.1 编译安装

简单来说，编译就是将程序的源代码转换成可执行文件的过程。大多数 Linux 的程序都是开放源码的，可以编译成适合我们的电脑和操纵系统属性的可执行文件。

  

基本步骤如下：

1. 下载源代码
2. 解压压缩包
3. 配置
4. 编译
5. 安装  
    

### 0.2 实际案例

### 0.3 1、下载

我们来编译安装 htop 软件，首先在它的官网下载源码：**[http://bintray.com/htop/source](https://link.zhihu.com/?target=http%3A//bintray.com/htop/source)…**[1]

  

下载好的源码在本机电脑上使用如下命令同步到服务器上：

scp 文件名 用户名@服务器ip:目标路径

scp ~/Desktop/htop-3.0.0.tar.gz root@121.42.11.34:.

也可以使用 wegt 进行下载：

wegt+下载地址

wegt [https://bintray.com/htop/source/download_file?file_path=htop-3.0.0.tar.gz](https://link.zhihu.com/?target=https%3A//bintray.com/htop/source/download_file%3Ffile_path%3Dhtop-3.0.0.tar.gz)

### 0.4 2、解压文件

tar -zxvf htop-3.0.0.tar.gz

# 解压cd htop-3.0.0 # 进入目录

### 0.1 3、配置

执行 ./configure ，它会分析你的电脑去确认编译所需的工具是否都已经安装了。

### 0.2 4、编译

执行 make 命令

  

### 0.3 5、安装

执行 make install 命令，安装完成后执行 ls /usr/local/bin/ 查看是否有 htop 命令。如果有就可以执行 htop 命令查看系统进程了。

  

## 1 九、网络

  

### 1.1 **ifconfig**

**查看 ip 网络相关信息，如果命令不存在的话， 执行命令 yum install net-tools 安装。**

  

参数解析：

- eth0 对应有线连接（对应你的有线网卡），就是用网线来连接的上网。eth 是 Ethernet 的缩写，表示"[以太网](https://www.zhihu.com/search?q=%E4%BB%A5%E5%A4%AA%E7%BD%91&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2717297135%7D)"。有些电脑可能同时有好几条网线连着，例如服务器，那么除了eht0 ，你还会看到 eth1 、 eth2 等。  
    
- lo 表示本地回环（ Local Loopback 的缩写，对应一个[虚拟网卡](https://www.zhihu.com/search?q=%E8%99%9A%E6%8B%9F%E7%BD%91%E5%8D%A1&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2717297135%7D)）可以看到它的 ip 地址是 127.0.0.1 。每台电脑都应该有这个接口，因为它对应着"连向自己的链接"。这也是被称之为"本地回环"的原因。所有经由这个接口发送的东西都会回到你自己的电脑。看起来好像并没有什么用，但有时为了某些缘故，我们需要连接自己。例如用来测试一个网络程序，但又不想让局域网或外网的用户查看，只能在此台主机上运行和查看所有的网络接口。例如在我们启动一个前端工程时，在浏览器输入 127.0.0.1:3000 启动项目就能查看到自己的 web 网站，并且它只有你能看到。  
    
- wlan0 表示无线局域网

  

### 1.2 **host**

**ip 地址和主机名的互相转换。**

  

### 1.3 **ssh 连接远程服务器**

**通过[非对称加密](https://www.zhihu.com/search?q=%E9%9D%9E%E5%AF%B9%E7%A7%B0%E5%8A%A0%E5%AF%86&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2717297135%7D)以及对称加密的方式（同 HTTPS 安全连接原理相似）连接到远端服务器。**

  

### 1.4 ***h

config 文件可以***h ，方便批量管理多个 ssh 连接。

配置文件分为以下几种：

- 全局 ssh 服务端的配置：/etc/ssh/sshd_config ；
- 全局 ssh 客户端的配置：/etc/ssh/ssh_config（很少修改）；
- 当前用户 ssh 客户端的***h/config 。

  

  

![](https://pica.zhimg.com/80/v2-6822a5b5868d9e08fb6d9fbae94b6661_1440w.webp?source=1940ef5c)

  

  

配置当前用户的 config ：

# 创建config

vim ~/.ssh/config

# 填写一下内容

Host lion # 别名 HostName 172.x.x.x # ip 地址 Port 22 # 端口 User root # 用户

这样配置完成后，下次登录时，可以这样登录 ssh lion 会自动识别为 root 用户。

[注意] 这段配置不是在服务器上，而是你自己的机器上，它仅仅是设置了一个别名。

### 0.1 wget

可以使我们直接从终端控制台下载文件，只需要给出文件的HTTP或FTP地址。

  

## 1 十 备份

  

### 1.1 scp

  

**它是 Secure Copy 的缩写，表示安全拷贝。scp 可以使我们通过网络，把文件从一台电脑拷贝到另一台电脑。**

  

scp 是基于 ssh 的原理来运作的， ssh 会在两台通过网络连接的电脑之间创建一条安全通信的管道， scp 就利用这条管道安全地拷贝文件。

  

scp source_file destination_file

# source_file 表示源文件，destination_file 表示目标文件

其中 source_file 和 destination_file 都可以这样表示：user@ip:file_name ， user 是登录名， ip 是域名或 ip 地址。file_name 是文件路径。

```text
scp root@192.168.1.5:/root/file.txt file.txt # 表示把远程电脑上的 file.txt 文件拷贝到本机
scp file.txt root@192.168.1.5:/root # 表示把我的电脑中当前文件夹下的 file.txt 文件拷贝到远程电脑
```

  

### 0.1 rsync

rsync 命令主要用于远程同步文件。它可以同步两个目录，不管它们是否处于同一台电脑。它应该是最常用于"[增量备份](https://www.zhihu.com/search?q=%E5%A2%9E%E9%87%8F%E5%A4%87%E4%BB%BD&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2717297135%7D)"的命令了。它就是智能版的 scp 命令。

  

### 0.2 软件安装

```text
yum install rsync复制代码
```

### 0.3 基础用法

rsync -arv Images/ backups/

# 将Images 目录下的所有文件备份到 backups 目录下

rsync -arv Images/ root@192.x.x.x:backups/

# 同步到服务器的backups目录下

### 0.1 常用参数

- -a 保留文件的所有信息，包括权限，修改日期等；
- -r 递归调用，表示子目录的所有文件也都包括；
- -v 冗余模式，输出详细操作信息。

默认地， rsync 在同步时并不会删除目标目录的文件，例如你在源目录中删除一个文件，但是用 rsync 同步时，它并不会删除同步目录中的相同文件。如果向删除也可以这么做：rsync -arv --delete Images/ backups/ 。

  

## 1 十一 系统

  

### 1.1 halt

关闭系统，需要 root 身份。

### 1.2 reboot

重启系统，需要 root 身份。

```text
reboot
```

### 1.3 poweroff

直接运行即可关机，不需要 root 身份。

  

## 2 十二 Vim 编辑器

## 3 Vim 是什么？

Vim 是从 vi 发展出来的一个[文本编辑器](https://www.zhihu.com/search?q=%E6%96%87%E6%9C%AC%E7%BC%96%E8%BE%91%E5%99%A8&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2717297135%7D)。其代码补完、编译及错误跳转等方便编程的功能特别丰富，在程序员中被广泛使用。和 Emacs 并列成为类 Unix 系统用户最喜欢的编辑器。

  

## 4 Vim 常用模式

- 交互模式
- 插入模式
- 命令模式
- 可视模式  
    

### 4.1 交互模式

也成为正常模式，这是 Vim 的默认模式，每次运行 Vim 程序的时候，就会进入这个模式。

例如执行 vim name.txt 则会进入交互模式。

  

交互模式特征：

- 在这个模式下，你不能输入文本；
- 它可以让我们在文本间移动，删除一行文本，复制黏贴文本，跳转到指定行，撤销操作，等等  
    

### 4.2 插入模式

  

这个模式是我们熟悉的文本编辑器的模式，就是可以输入任何你想输入的内容。进入这个模式有几种方法，最常用的方法是按字母键 i （ i、I、a、A、o、O 都可以进入插入模式，只是所处的位置不同），退出这种模式，只需要按下 Esc 键。

  

- i, I 进入输入模式 Insert mode ：i 为"从目前光标所在处输入"， I 为"在目前所在行的第一个非空格符处开始输入"；
- a, A 进入输入模式 Insert mode ：a 为"从目前光标所在的下一个字符处开始输入"，A 为"从光标所在行的最后一个字符处开始输入"；
- o, O 进入输入模式 Insert mode ：o 为"在目前光标所在的下一行处输入新的一行"；O 为在目前光标所在处的上一行输入新的一行。

### 4.3 

### 4.4 命令模式

命令模式也称为底线命令模式，这个模式下可以运行一些命令例如"退出"，"保存"，等动作。

也可以用这个模式来激活一些 Vim 配置，例如语法高亮，显示行号，等。甚至还可以发送一些命令给终端命令行，例如 ls、cp 。

  

为了进入命令模式，首先要进入交互模式，再按下冒号键。

用一张图表示三种模式如何切换：

  

![](https://picx.zhimg.com/80/v2-ba2da86f7f9e710f75d2b52449458f07_1440w.webp?source=1940ef5c)

  

基本操作

  

### 4.5 打开 Vim

在终端命令行中输入 vim 回车后 Vim 就会被运行起来，也可以用 Vim 来打开一个文件，只需要在 vim 后面再加文件名。如 vim file.name ，如果文件不存在，那么会被创建。  

### 4.6 插入

进入文件之后，此时处于交互模式，可以通过输入 i 进入插入模式  

### 4.7 移动

在 Vim 的交互模式下，我们可以在文本中移动光标。

- h 向左移动一个字符
- j 向下移动一个字符
- k 向上移动一个字符
- i 向右移动一个字符

当然也可以使用四个方向键进行移动，效果是一样的。  

### 4.8 跳至行首和行末

- 行首：在交互模式下，为了将光标定位到一行的开始位置，只需要按下数字键 0 即可，键盘上的 Home 键也有相同效果。
- 行末：在交互模式下，为了将光标定位到一行的末尾，只需要按下美元符号键 $ 即可，键盘上的 End 键也有相同效果。

  

### 4.9 按单词移动

在交互模式下，按字母键 w 可以一个单词一个单词的移动。

### 4.10 退出文件

在交互模式下，按下冒号键 : 进入命令模式，再按下 q 键，就可以退出了。

如果在退出之前又修改了文件，就直接想用 :q 退出 Vim ，那么 Vim 会显示一个红字标明错误信息。此时我们有两个选择：

1. 保存并退出 :wq 或 :x ；
2. 不保存且退出 :q! 。

  

## 5 标准操作

### 5.1 删除字符

在交互模式下，将光标定位到一个你想要删除的字符上，按下字母键 x 你会发现这个字符被删除了。

也可以一次性删除多个字符，只需要在按 x 键之前输入数字即可。  

### 5.2 删除（剪切）单词，行

- 删除一行：连按两次 d 来删除光标所在的那一行。
- 删除多行：例如先输入数字 2 ，再按下 dd ，就会删除从光标所在行开始的两行。
- 删除一个单词：将光标置于一个单词的首字母处，然后按下 dw 。
- 删除多个单词：例如先按数字键 2 再按 dw 就可以删除两个单词了。
- 从光标所在位置删除至行首：d0 。
- 从光标所在位置删除至行末：d$ 。

  

### 5.3 复制单词，行

- 复制行：按两次 y 会把光标所在行复制到内存中，和 dd 类似， dd 用于"剪切"光标所在行。
- 复制单词：yw 会复制一个单词。
- 复制到行末：y$ 是复制从光标所在处到行末的所有字符。
- 复制到行首：y0 是复制光标所在处到行首的所有字符。  
    

### 5.4 粘贴

如果之前用 dd 或者 yy 剪切复制过来的，可以使用 p 来粘贴。同样也可以使用 数字+p来表示复制多次。  

### 5.5 替换一个字符

在交互模式下，将光标置于想要替换的字符上。按下 r 键，接着输入你要替换的字符即可。  

### 5.6 撤销操作

如果要撤销最近的修改，只需要按下 u 键，如果想要撤销最近四次修改，可以按下4，再按下 u 。  

### 5.7 重做

取消撤销，也就是重做之前的修改使用 ctrl + r 。  

### 5.8 跳转到指定行

Vim 编辑的文件中，每一行都有一个行号，行号从1开始，逐一递增。

行号默认是不显示，如果需要它显示的话，可以进入命令模式，然后输入 set nu ，如果要隐藏行号的话，使用 set nonu 。

- 跳转到指定行：数字+gg ，例如 7gg ，表示跳转到第7行。
- 要跳转到最后一行，按下 G 。
- 要跳转到第一行，按下 gg 。

  

## 6 高级操作

### 6.1 查找

处于交互模式下，按下 / 键，那么就进入查找模式，输入你要查找的字符串，然后按下回车。光标就会跳转到文件中下一个查找到的匹配处。如果字符串不存在，那么会显示 "pattern not found" 。

- n 跳转到下一个匹配项；
- N 跳转到上一个匹配项。

[注意] 用斜杠来进行的查找是从当前光标处开始向文件尾搜索，如果你要从当前光标处开始，向文件头搜索则使用 ? ，当然也可以先按下 gg 跳转到第一行在进行全文搜索。  

### 6.2 查找并替换

替换光标所在行第一个匹配的字符串：

# 语法:s/旧字符串/新字符串# 实例:s/one/two

  

替换光标所在行所有旧字符串为新字符串：

```text
# 语法:s/旧字符串/新字符串/g
```

替换第几行到第几行中所有字符串：

# 语法:n,m s/旧字符串/新字符串/g

# 实例:2,4 s/one/two/g

最常用的就是全文替换了：

```text
# 语法:%s/旧字符串/新字符串/g
```

### 0.1 合并文件

可以用冒号 +r ( :r ) 实现在光标处插入一个文件的内容。

```text
:r filename # 可以用Tab键来自动补全另外一个文件的路径
```