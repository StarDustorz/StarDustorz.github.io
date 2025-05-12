---
title: "[Go] Map"
date: 2021-10-26
tags:
  - Golang
categories:
  - Golang
  - 数据结构
published: true
toc: "true"
comments: "true"
description:
---
>map 的底层数据结构和实现原理

<!--more-->

## 1 基础使用

### 1.1 概述

核心特征包含下述三点：
- 存储基于 key-value 对映射的模式；
- 基于 key 维度实现存储数据的去重；
- 读、写、删操作控制，时间复杂度 O(1).

### 1.2 初始化

```go
myMap1 := make(map[int]int,2)
myMap2 := make(map[int]int)

myMap3 :=map[int]int{
  1:2,
  3:4,
}
```

- map 中，key 的数据类型必须为可比较的类型，chan、map、func不可比较

### 1.3 读

- 直接读，倘若 key 存在，则获取到对应的 val，倘若 key 不存在或者 map 未初始化，会返回 val 类型的零值作为兜底.
- 读的同时添加一个 bool 类型的 flag 标识是否读取成功. 倘若 ok == false，说明读取失败， key 不存在，或者 map 未初始化.
### 1.4 写

- 如果 map 未初始化，直接执行写操作会导致 panic
### 1.5 删除

- 执行 delete 方法时，倘若 key 存在，则会从 map 中将对应的 key-value 对删除；倘若 key 不存在或 map 未初始化，则方法直接结束，不会产生显式提示
### 1.6 遍历


- 基于 k,v 依次承接 map 中的 key-value 对
```go
for k,v := range myMap{
  // ...
}
```


- 基于 k 依次承接 map 中的 key，不关注 val 的取值
```go
for k := range myMap{
  // ...
}
```

- 在执行 map 遍历操作时，获取的 key-value 对并没有一个固定的顺序，因此前后两次遍历顺序可能存在差异

### 1.7 并发冲突

map 不是并发安全的数据结构，倘若存在并发读写行为，会抛出 fatal error.
具体规则是：
- 并发读没有问题；
- 并发读写中的“写”是广义上的，包含写入、更新、删除等操作；
- 读的时候发现其他 goroutine 在并发写，抛出 fatal error；
- 写的时候发现其他 goroutine 在并发写，抛出 fatal error.
> fatal error，是一种比 panic 更严重的错误，无法使用 recover 操作捕获.

## 2 核心原理

hashmap 就是在算法上基于 hash 实现 key 的映射和寻址；在数据结构上基于桶数组实现 key-value 对的存储.
- 通过哈希方法取得 key 的 hash 值
- hash 值对桶数组长度取模，确定其所属的桶；
- 在桶中插入 key-value 对.
- 相同的 key 必然产生相同的 hash 值，因此能映射到相同的桶中，通过桶内遍历的方式锁定对应的 key-value 对

### 2.1 hash

> hash 译作散列，是一种将任意长度的输入压缩到某一固定长度的输出摘要的过程，由于这种转换属于压缩映射，输入空间远大于输出空间，因此不同输入可能会映射成相同的输出结果. 此外，hash在压缩过程中会存在部分信息的遗失，因此这种映射关系具有不可逆的特质.

- hash 的可重入性：相同的 key，必然产生相同的 hash 值
- hash 的离散性：只要两个 key 不相同，不论其相似度的高低，产生的 hash 值会在整个输出域内均匀地离散化
- hash 的离散性：只要两个 key 不相同，不论其相似度的高低，产生的 hash 值会在整个输出域内均匀地离散化
- hash 冲突：由于输入域（key）无穷大，输出域（hash 值）有限，因此必然存在不同 key 映射到相同 hash 值的情况，称之为 hash 冲突

### 2.2 桶数组

map 中，会通过长度为 2 的整数次幂的桶数组进行 key-value 对的存储：
- 每个桶固定可以存放 8 个 key-value 对；
- 倘若超过 8 个 key-value 对打到桶数组的同一个索引当中，此时会通过创建桶链表的方式来化解这一问题.
### 2.3 hash 冲突

- 由于 hash 冲突的存在，不同 key 可能存在相同的 hash 值; hash 值会对桶数组长度取模，因此不同 hash 值可能被打到同一个桶中; 不同的 key-value 可能被映射到 map 的同一个桶当中
- 拉链法: 将命中同一个桶的元素通过链表的形式进行链接，因此很便于动态扩展.
- 开放寻址法: 在插入新条目时，会基于一定的探测策略持续寻找，直到找到一个可用于存放数据的空位为止
-  map 的插入写流程, 结合了拉链法和开放寻址法两种思路
	- 桶数组中的每个桶，严格意义上是一个单向桶链表，以桶为节点进行串联
	- 每个桶固定可以存放 8 个 key-value 对
	- 当 key 命中一个桶时，首先根据开放寻址法，在桶的 8 个位置中寻找空位进行插入
	- 倘若桶的 8 个位置都已被占满，则基于桶的溢出桶指针，找到下一个桶，重复第（3）步
	- 倘若遍历到链表尾部，仍未找到空位，则基于拉链法，在桶链表尾部续接新桶，并插入 key-value 对

### 2.4 扩容优化性能

> map 的桶数组长度固定不变，那么随着 key-value 对数量的增长，当一个桶下挂载的 key-value 达到一定的量级，此时操作的时间复杂度会趋于线性, 导致性能不可接受

扩容机制:
- 扩容分为增量扩容和等量扩容
- 当桶内 key-value 总数/桶数组长度 > 6.5 时发生增量扩容，桶数组长度增长为原值的两倍
- 当桶内溢出桶数量大于等于 2^B 时( B 为桶数组长度的指数，B 最大取 15)，发生等量扩容，桶的长度保持为原值
- 采用渐进扩容的方式，当桶被实际操作到时，由使用者负责完成数据迁移，避免因为一次性的全量数据迁移引发性能抖动


## 3 数据结构

### 3.1 hmap

![](StarDust/source/_posts/技术/Golang/0%20基础/数据结构/Map/file-20250305235454430.png)

```go
type hmap struct {
    count     int 
    flags     uint8
    B         uint8  
    noverflow uint16 
    hash0     uint32 
    buckets    unsafe.Pointer 
    oldbuckets unsafe.Pointer 
    nevacuate  uintptr       
    extra *mapextra 
}
```

- count：map 中的 key-value 总数
- flags：map 状态标识，可以标识出 map 是否被 goroutine 并发读写
- B：桶数组长度的指数，桶数组长度为 2^B
- noverflow：map 中溢出桶的数量
- hash0：hash 随机因子，生成 key 的 hash 值时会使用到
- buckets：桶数组
- oldbuckets：扩容过程中老的桶数组
- nevacuate：扩容时的进度标识，index 小于 nevacuate 的桶都已经由老桶转移到新桶中
- extra：预申请的溢出桶

### 3.2 mapextra

```go
type mapextra struct {
    overflow    *[]*bmap
    oldoverflow *[]*bmap
  
    nextOverflow *bmap
}
```

在 map 初始化时，如果容量过大，会提前申请好一批溢出桶，方便后续使用，这部分溢出桶存放在 hmap.mapextra 当中
- mapextra.overflow：供桶数组 buckets 使用的溢出桶
- mapextra.oldoverFlow: 扩容流程中，供老桶数组 oldBuckets 使用的溢出桶
- mapextra.nextOverflow：下一个可用的溢出桶

### 3.3 bmap

```go
const bucketCnt = 8
type bmap struct {
	tophash [bucketCnt]uint8
}
```

- bmap 就是 map 中的桶，可以存储 8 组 key-value 对的数据，以及一个指向下一个溢出桶的指针
- 每组 key-value 对数据包含 key 高 8 位 hash 值 tophash，key 和 val 三部分
-  tophash、key 和 val 的数据长度固定，因此可以通过内存地址偏移的方式寻找到后续的 key 数组、val 数组以及溢出桶指针

## 4 构造方法

>创建 map 时，会调用 runtime/map.go 文件中的 makemap 方法

### 4.1 makemap

- hint 为 map 拟分配的容量；在分配前，会提前对拟分配的内存大小进行判断，倘若超限，会将 hint 置为零
- 通过 new 方法初始化 hmap
- 调用 fastrand，构造 hash 因子：hmap.hash0
- 大致上基于 log2(B) >= hint 的思路,计算桶数组的容量 B
- 调用 makeBucketArray 方法，初始化桶数组 hmap.buckets
- 倘若 map 容量较大，会提前申请一批溢出桶 hmap.extra

### 4.2 overLoadFactor

通过 overLoadFactor 方法，对 map 预分配容量和桶数组长度指数进行判断，决定是否仍需要增长 B 的数值
- map 预分配容量小于等于 8，B 取 0，桶的个数为 1
- 保证 map 预分配容量小于等于桶数组长度 * 6.5

### 4.3 makeBucketArray

- makeBucketArray 会为 map 的桶数组申请内存，在桶数组的指数 b >= 4时（桶数组的容量 >= 52 ），会需要提前创建溢出桶.
- 通过 base 记录桶数组的长度，不包含溢出桶；通过 nbuckets 记录累加上溢出桶后，桶数组的总长度.
- 调用 newarray 方法为桶数组申请内存空间，连带着需要初始化的溢出桶
- 倘若 base != nbuckets，说明需要创建溢出桶，会基于地址偏移的方式，通过 nextOverflow 指向首个溢出桶的地址
- 倘若需要创建溢出桶，会在将最后一个溢出桶的 overflow 指针指向 buckets 数组，以此来标识申请的溢出桶已经用完

## 5 读流程

> map 读操作最终会走进 runtime/map.go 的 mapaccess 方法中
### 5.1 读流程概览

map 读流程主要分为以下几步：
- 根据 key 取 hash 值
- 根据 hash 值对桶数组取模，确定所在的桶
- 沿着桶链表依次遍历各个桶内的 key-value 对
- 命中相同的 key，则返回 value；倘若 key 不存在，则返回零值


### 5.2 mapaccess 方法

- 倘若 map 未初始化，或此时存在 key-value 对数量为 0，直接返回零值
- 倘若发现存在其他 goroutine 在写 map，直接抛出并发读写的 fatal error；其中，并发写标记，位于 hmap.flags 的第 3 个 bit 位
- 通过 maptype.hasher() 方法计算得到 key 的 hash 值，并对桶数组长度取模，取得对应的桶
- 在取桶时，会关注当前 map 是否处于扩容的流程，倘若是的话，需要在老的桶数组 oldBuckets 中取桶，通过 evacuated 方法判断桶数据是已迁到新桶还是仍存留在老桶，倘若仍在老桶，需要取老桶进行遍历
	- 在取老桶前，会先判断 map 的扩容流程是否是增量扩容，倘若是的话，说明老桶数组的长度是新桶数组的一半，需要将桶长度值 m 除以 2
	- 取老桶时，会调用 evacuated 方法判断数据是否已经迁移到新桶. 判断的方式是，取桶中首个 tophash 值，倘若该值为 2,3,4 中的一个，都代表数据已经完成迁移
- 取 key hash 值的高 8 位值 top. 倘若该值 < 5，会累加 5，以避开 0 ~ 4 的取值. 因为这几个值会用于枚举
- 开启两层 for 循环进行遍历流程，外层基于桶链表，依次遍历首个桶和后续的每个溢出桶，内层依次遍历一个桶内的 key-value 对


## 6 写流程

### 6.1 写流程梳理

map 写流程主要分为以下几步：
- 根据 key 取 hash 值；
- 根据 hash 值对桶数组取模，确定所在的桶；
- 倘若 map 处于扩容，则迁移命中的桶，帮助推进渐进式扩容；
- 沿着桶链表依次遍历各个桶内的 key-value 对；
- 倘若命中相同的 key，则对 value 中进行更新；
- 倘若 key 不存在，则插入 key-value 对；
- 倘若发现 map 达成扩容条件，则会开启扩容模式，并重新返回第（2）步

### 6.2  mapassign

- 写操作时，倘若 map 未初始化，直接 panic
- 倘若其他 goroutine 在进行写或删操作，抛出并发写 fatal error
- 通过 maptype.hasher() 方法求得 key 对应的 hash 值
- 通过异或位运算，将 map.flags 的第 3 个 bit 位置为 1，添加写标记
- 倘若 map 的桶数组 buckets 未空，则对其进行初始化
- 找到当前 key 对应的桶索引 bucket
- 倘若发现当前 map 正处于扩容过程，则帮助其渐进扩容
- 从 map 的桶数组 buckets 出发，结合桶索引和桶容量大小，进行地址偏移，获得对应桶 b
- 取得 key 的高 8 位 tophash
- 提前声明好的三个指针，用于指向存放 key-value 的空槽
- 开启两层 for 循环，外层沿着桶链表依次遍历，内层依次遍历桶内的 key-value 对
- 倘若 key 的 tophash 和当前位置 tophash 不同，则会尝试将 inserti、insertk elem 调整指向首个空位，用于后续的插入操作
- 倘若找到了相等的 key，则执行更新操作，并且直接跳转到方法的 done 标志位处，进行收尾处理
- 倘若没找到相等的 key，会在执行插入操作前，判断 map 是否需要开启扩容模式
- 倘若遍历完桶链表，都没有为当前待插入的 key-value 对找到空位，则会创建一个新的溢出桶，挂载在桶链表的尾部，并将 inserti、insertk、elem 指向溢出桶的首个空位
- 将 tophash、key、value 插入到取得空位中，并且将 map 的 key-value 对计数器 count 值加 1
- 收尾环节，再次校验是否有其他协程并发写，倘若有，则抛 fatal error. 将 hmap.flags 中的写标记抹去，然后退出方法

## 7 删流程

### 7.1 删流程梳理

- 根据 key 取 hash 值
- 根据 hash 值对桶数组取模，确定所在的桶
- 倘若 map 处于扩容，则迁移命中的桶，帮助推进渐进式扩容
- 沿着桶链表依次遍历各个桶内的 key-value 对
- 倘若命中相同的 key，删除对应的 key-value 对；并将当前位置的 tophash 置为 emptyOne，表示为空
- 倘若当前位置为末位，或者下一个位置的 tophash 为 emptyRest，则沿当前位置向前遍历，将毗邻的 emptyOne 统一更新为 emptyRest


## 8 遍历流程

map 的遍历流程首先会走进 runtime/map.go 的 mapiterinit() 方法当中，初始化用于遍历的迭代器 hiter；接着会调用 runtime/map.go 的 mapiternext() 方法开启遍历流程

### 8.1 迭代器数据结构

```go
type hiter struct {
    key         unsafe.Pointer 
    elem        unsafe.Pointer 
    t           *maptype
    h           *hmap
    buckets     unsafe.Pointer 
    bptr        *bmap         
    overflow    *[]*bmap      
    oldoverflow *[]*bmap      
    startBucket uintptr       
    offset      uint8         
    wrapped     bool         
    B           uint8
    i           uint8
    bucket      uintptr
    checkBucket uintptr
}
```

- key：指向遍历得到 key 的指针
- value：指向遍历得到 value 的指针
- t：map 类型，包含了 key、value 类型大小等信息
- h：map 的指针
- bptr：当前遍历到的桶
- startBucket：遍历起始位置的桶索引
- offset：遍历起始位置的 key-value 对索引
- wrapped：遍历是否穿越桶数组尾端回到头部了
- i：当前遍历到的 key-value 对在桶中的索引
- checkBucket：因为扩容流程的存在，需要额外检查的桶


## 9 扩容流程

### 9.1 扩容类型

map 的扩容类型分为两类，一类叫做增量扩容，一类叫做等量扩容
- 增量扩容
	- 扩容后，桶数组的长度增长为原长度的 2 倍
	- 降低每个桶中 key-value 对的数量，优化 map 操作的时间复杂度
- 等量扩容
	- 扩容后，桶数组的长度和之前保持一致；但是溢出桶的数量会下降
	- 提高桶主体结构的数据填充率，减少溢出桶数量，避免发生内存泄漏

### 9.2 扩容触发

- 只有 map 的写流程可能开启扩容模式
- 写 map 新插入 key-value 对之前，会发起是否需要扩容的逻辑判断
- 根据 hmap 的 oldbuckets 是否空，可以判断 map 此前是否已开启扩容模式
- 倘若此前未进入扩容模式，且 map 中 key-value 对的数量超过 8 个，且大于桶数组长度的 6.5 倍，则进入增量扩容
- 倘若溢出桶的数量大于 2^B 个（即桶数组的长度；B 大于 15 时取15），则进入等量扩容

### 9.3 扩容迁移规则

- 在等量扩容中，新桶数组长度与原桶数组相同；
- key-value 对在新桶数组和老桶数组的中的索引号保持一致；
- 在增量扩容中，新桶数组长度为原桶数组的两倍；
- 把新桶数组中桶号对应于老桶数组的区域称为 x 区域，新扩展的区域称为 y 区域.
- 实际上，一个 key 属于哪个桶，取决于其 hash 值对桶数组长度取模得到的结果，因此依赖于其低位的 hash 值结果.；
- 在增量扩容流程中，新桶数组的长度会扩展一位，假定 key 原本从属的桶号为 i，则在新桶数组中从属的桶号只可能是 i （x 区域）或者 i + 老桶数组长度（y 区域）；
- 当 key 低位 hash 值向左扩展一位的 bit 位为 0，则应该迁往 x 区域的 i 位置；倘若该 bit 位为 1，应该迁往 y 区域对应的 i + 老桶数组长度的位置.

### 9.4 渐进式扩容

- map 采用的是渐进扩容的方式，避免因为一次性的全量数据迁移引发性能抖动.
- 当每次触发写、删操作时，会为处于扩容流程中的 map 完成两组桶的数据迁移
	- 一组桶是当前写、删操作所命中的桶
	- 另一组桶是，当前未迁移的桶中，索引最小的那个桶


