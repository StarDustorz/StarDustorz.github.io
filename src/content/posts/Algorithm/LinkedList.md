---
title: "[Algorithm] LinkedList"
published: 2021-06-12
tags:
  - Algorithm
lang: zh
toc: true
abbrlink: algorithm-linkedlist
---
<!--more-->


2### 0.1 定义

```java
// Definition for singly-linked list.
public class SinglyListNode {
    int val;
    SinglyListNode next;
    SinglyListNode(int x) { val = x; }
}
```


## 1 [206. 反转链表](https://leetcode-cn.com/problems/reverse-linked-list/) *

题目：反转一个单链表

1.双指针迭代

从前向后反转

```java
class Solution {
    public ListNode reverseList(ListNode head) {
        // cur 是当前需要翻转的节点
        // pre 是 cur 的前一个节点
        ListNode cur = head, pre = null;
        while(cur != null) {
            // 记录 cur 的下一个节点
            ListNode temp = cur.next;
            cur.next = pre;
            pre = cur;
            cur = temp;
        }
        // 最后 cur 是 null, pre 是新链表的 head
        return pre;
    }
}
```


2.递归

从后往前反转

终止条件是当前节点或者下一个节点==null
```java

class Solution {
	public ListNode reverseList(ListNode head) {
		//递归终止条件是当前为空，或者下一个节点为空
		if(head==null || head.next==null) {
			return head;
		}
    // cur 从头到尾是不变的 都是指向最后递归结束时的
		ListNode cur = reverseList(head.next);
		head.next.next = head;
		//防止链表循环，需要将head.next设置为空
		head.next = null;
	  //每层递归函数都返回cur，也就是最后一个节点
		return cur;
	}
}

reverseList(5) 中 head=5，head.next=null，返回head=5
reverseList(4) cur = 5，head=4，head.next=5
reverseList(3)
reverseList(2)
reverseList(1)
```



## 2 [92. 反转链表 II](https://leetcode-cn.com/problems/reverse-linked-list-ii/)  *

题目：反转从位置 m 到 n 的链表。请使用一趟扫描完成反转。

```java
// 递归实现
时间复杂度：O(n)
空间复杂度：O(1)
class Solution {
    // 记录第 N+1 个节点
    ListNode mark = null;
    public ListNode reverseBetween(ListNode head, int left, int right) {
        // 递归到变成翻转前n 个节点
        if (left == 1){
            return reverseN(head, right);
        }
        head.next = reverseBetween(head.next, left - 1, right - 1);
        return head;
    }

    // 递归翻转从 root 开始,长度为 n 的链表
    private ListNode reverseN(ListNode root, int n) {
        // basecase,只有一个节点,也就是第 n 个,返回它本身
        if (n == 1){
            // mark 记录第 n 加一个,避免断链
            mark = root.next;
            return root;
        }
        ListNode cur = reverseN(root.next, n - 1);
        root.next.next = root;
        // root 是翻转后的最后一个,连上后面
        root.next = mark;
        return cur;
    }
}
```



```java
// 迭代实现,头插法
时间复杂度：O(n)
空间复杂度：O(1)
class Solution {
    public ListNode reverseBetween(ListNode head, int left, int right) {
        ListNode dummy = new ListNode(-1);
        dummy.next = head;

        // 需要翻转的节点数
        right = right - left;
        ListNode cur = dummy;
        // 移动到 left 左侧
        while (left-- > 1) cur = cur.next;
        ListNode a = cur.next, b = a.next;
        
        // 将中间的链表翻转,此时 cur 在前一段最后,a 在第一段最后,b 在最后一段开始
        while (right-- > 0) {
            ListNode tmp = b.next;
            b.next = a;
            a = b;
            b = tmp;
        }
        // 将第二段开头连上第三段开头
        cur.next.next = b;
        // 第一段末尾连上第二段末尾
        cur.next = a;
        return dummy.next;
    }
}
```



## 3 [25. K 个一组翻转链表](https://leetcode-cn.com/problems/reverse-nodes-in-k-group/) important

给你一个链表，每 k 个节点一组进行翻转，请你返回翻转后的链表。

k 是一个正整数，它的值小于或等于链表的长度。

如果节点总数不是 k 的整数倍，那么请将最后剩余的节点保持原有顺序。

```java
class Solution {
    public ListNode reverseKGroup(ListNode head, int k) {
        //哑节点辅助反转
        ListNode dummyNode = new ListNode(-1);
        dummyNode.next = head;
        //将从pre的下一个节点开始反转
        ListNode pre = dummyNode;
        //当前已经反转完成的位置
        ListNode cur = head;
        //需要进行反转的节点
        ListNode next;
        ListNode p = head;
        int len = 0;
        while(p != null){
            len++;
            p = p.next;
        }
        //需要翻转len/k组
        for(int i = 0; i < len/k; i++){
            //每组需要将k-1个节点头插法到pre后面
            for(int j = 0; j < k-1; j++){
                next = cur.next;
                cur.next = next.next;
                next.next = pre.next;
                pre.next = next;
            }
            //一组反转完成后，重置pre和cur位置
            pre = cur;
            cur = pre.next;
        }
        return dummyNode.next;
    }
}

// 递归解法
class Solution {
    public ListNode reverseKGroup(ListNode head, int k) {
        if (head == null) return null;
        // 区间 [a, b) 包含 k 个待反转元素
        ListNode a, b;
        a = b = head;
        for (int i = 0; i < k; i++) {
            // 不足 k 个，不需要反转，base case
            if (b == null) return head;
            b = b.next;
        }
        // 反转前 k 个元素
        ListNode newHead = reverse(a, b);
        // 递归反转后续链表并连接起来
        a.next = reverseKGroup(b, k);
        return newHead;
    }

    /* 反转区间 [a, b) 的元素，注意是左闭右开 */
    ListNode reverse(ListNode a, ListNode b) {
        ListNode pre, cur, nxt;
        pre = null;
        cur = a;
        nxt = a;
        // while 终止的条件改一下就行了
        while (cur != b) {
            nxt = cur.next;
            cur.next = pre;
            pre = cur;
            cur = nxt;
        }
        // 返回反转后的头结点
        return pre;
    }
}
```



## 4 [83. 删除排序链表中的重复元素](https://leetcode-cn.com/problems/remove-duplicates-from-sorted-list/)

题目：给定一个排序链表，删除所有重复的元素，使得每个元素只出现一次。

思路：从头到尾遍历，将结点的值与后面 的结点值比较，如果重复就跳过下一个结点指向之后的结点。


代码：

```java
public class Solution {
    public ListNode deleteDuplicates(ListNode head) {
        ListNode current = head;
        while (current != null && current.next != null) {
            if (current.next.val == current.val) {
            	current.next = current.next.next;
            } else {
            	current = current.next;
            }
        }
        return head;
    }
}
```



## 5 [82. 删除排序链表中的重复元素 II](https://leetcode-cn.com/problems/remove-duplicates-from-sorted-list-ii/)

题目：给定一个排序链表，删除所有重复的元素，只保留没有重复出现的结点。

思路：
1.头节点也可能要删除，增加一个哑结点
2.双指针a，b；a指向dummy，b指向head，如果a.next！=b.next 那么ab都往前，如果相等则只移动b到不等为止，然后a.next=b.next;b=b.next


代码：

```java
class Solution {
    public ListNode deleteDuplicates(ListNode head) {
        if(head==null || head.next==null) {
            return head;
        }
        ListNode dummy = new ListNode(-1);
        dummy.next = head;
        ListNode a = dummy;
        ListNode b = head;
        while(b!=null && b.next!=null) {
            //初始化的时a指向的是哑结点，所以比较逻辑应该是a的下一个节点和b的下一个节点
            if(a.next.val!=b.next.val) {
                a = a.next;
                b = b.next;
            }
            else {
                //如果a、b指向的节点值相等，就不断移动b，直到a、b指向的值不相等 
                while(b!=null && b.next!=null && a.next.val==b.next.val) {
                    b = b.next;
                }
                a.next = b.next;
                b = b.next;
            }
        }
        return dummy.next;
    }
}
```



## 6 从尾到头打印链表
题目：输入一个链表，按链表值从尾到头的顺序返回一个ArrayList。

思路：
1.递归

每层递归将值加入结果数组


代码：


```java
class Solution {
    ArrayList temp = new ArrayList();
    public int[] reversePrint(ListNode head) {
        recur(head);
        int[] res = new int[temp.size()];
        for(int i = 0;i < res.length;i++)
            res[i] = temp.get(i);
        return res;

}

void recur(ListNode head){
    if(head == null){
        return;
    }
    recur(head.next);
    temp.add(head.val);
}
}
```

2.辅助栈

遍历链表，将结点值入栈，遍历完成后将栈中元素存入数组，实现倒序输出

代码：

```java
class Solution {
    public int[] reversePrint(ListNode head) {
        Deque stack = new LinkedList();
        while(head != null){
           stack.add(head.val);
           head = head.next;
        }
        int[] res = new int[stack.size()];
        for(int i = 0;i < res.length ;i++){
            res[i] = stack.removeLast();
        }
        return res;
    }
}
```


## 7 链表中的倒数第K个节点 *
题目：输入一个链表，输出该链表中倒数第k个结点。

思路：双指针法，一个先走k步，另一个也开始走，直到

代码：


```java
class Solution {
    public ListNode getKthFromEnd(ListNode head, int k) {    
    ListNode a = head;
    ListNode b = head;
    for(int i = 0;i < k ;i++){
        b = b.next;
    }
    while(b != null){
        a = a.next;
        b = b.next;
    }
    return a;
}
}
```

## 8 [19. 删除链表的倒数第 N 个结点](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/)

```html
题目:给定一个链表，删除链表的倒数第 n 个节点，并且返回链表的头结点。
```

```html
给定一个链表: 1->2->3->4->5, 和 n = 2.

当删除了倒数第二个节点后，链表变为 1->2->3->5.
```

```java
 // 采用两个间隔为n的指针，同时向前移动。当快指针的下一个节点为最后一个节点时，要删除的节点就是慢指针的下一个节点。
class Solution {
    public ListNode removeNthFromEnd(ListNode head, int n) {
        // 只有一个节点
        if (head.next == null) return null;
        ListNode fast = head, slow = head;
        // fast 先走 n 步,然后一起到最后,slow 指向删除的前一个位置
        while(n-- > 0) fast = fast.next;
      	// 边界:如果有 n 个节点,删倒数第 n 个,也就是头结点
        if(fast == null) return head.next;
      	// 直到 fast 指向末尾,slow 指向待删除的前一个
        while(fast.next != null) {
            slow = slow.next;
            fast = fast.next;
        }
        slow.next = slow.next.next;
        return head;
    }
}
```



## 9 复杂链表的复制

题目：请实现 copyRandomList 函数，复制一个复杂链表。在复杂链表中，每个节点除了有一个 next 指针指向下一个节点，还有一个 random 指针指向链表中的任意节点或者 null。


思路：先在原链路中复制，然后建立random连接，最后拆分


代码：


```java
class Solution { //HashMap实现
    public Node copyRandomList(Node head) {
        HashMap map = new HashMap<>(); //创建HashMap集合
        Node cur=head;
        //复制结点值
        while(cur!=null){
            //存储put:
            map.put(cur,new Node(cur.val)); //顺序遍历，存储老结点和新结点(先存储新创建的结点值)
            cur=cur.next;
        }
        //复制结点指向
        cur = head;
        while(cur!=null){
            //得到get:.value2,3
            map.get(cur).next = map.get(cur.next); //新结点next指向同旧结点的next指向
            map.get(cur).random = map.get(cur.random); //新结点random指向同旧结点的random指向
            cur = cur.next;
        }   
	//返回复制的链表
    return map.get(head);
}
}
```

## 10 两个链表的第一个公共节点
题目：输入两个链表，找出它们的第一个公共节点。


思路：两个指针 node1，node2 分别指向两个链表 headA，headB 的头结点，然后同时分别逐结点遍历，当 node1 到达链表 headA 的末尾时，重新定位到链表 headB 的头结点；当 node2 到达链表 headB 的末尾时，重新定位到链表 headA 的头结点。

这样，当它们相遇时，所指向的结点就是第一个公共结点。


代码：

```java
public class Solution {
    public ListNode getIntersectionNode(ListNode headA, ListNode headB) {
        ListNode nodeA = headA;
        ListNode nodeB = headB;
        while(nodeA!=nodeB){
            nodeA = nodeA==null?headB:nodeA.next;
            nodeB = nodeB==null?headA:nodeB.next;
        }
        return nodeA;
    }
}
```



## 11 环型链表

题目：给定一个链表，判断链表中是否有环。


思路：快慢指针


代码：

```java
public class Solution {
    public boolean hasCycle(ListNode head) {
        if(head == null){
            return false;
        }
        ListNode low = head;
        ListNode fast = head.next;
        while( fast != null && fast.next != null){
            if(low.equals(fast) ){
                return true;
            }
            low = low.next;
            fast = fast.next.next;
        }
        return false;
        }
    }
```



## 12 [链表中环的入口结点](https://www.nowcoder.com/practice/253d2c59ec3e4bc68da16833f79a38e4?tpId=13&tqId=11208&tPage=3&rp=1&ru=%2Fta%2Fcoding-interviews&qru=%2Fta%2Fcoding-interviews%2Fquestion-ranking)


[https://leetcode-cn.com/problems/linked-list-cycle-ii/submissions/](https://leetcode-cn.com/problems/linked-list-cycle-ii/submissions/)

```java
// 快慢指针
public ListNode EntryNodeOfLoop(ListNode pHead) {
    // 设计双指针， 1. 边界都要判断下一个结点也是否为空
    if (pHead == null || pHead.next == null)
        return null;
    ListNode slow = pHead, fast = pHead;
    // 2. 快以二倍速前进，慢正常操作
    do {
        fast = fast.next.next;
        slow = slow.next;
    } while (slow != fast); // 3. 相遇点
    // 4. fast从头继续和slow正常走
    fast = pHead;
    while (slow != fast) { 
        slow = slow.next;
        fast = fast.next;
    }
    // 5. 返回slow，毕竟二者走在一块
    return slow;
}
```



## 13 [2. 两数相加](https://leetcode.cn/problems/add-two-numbers/)  *

题目:给你两个 非空 的链表，表示两个非负的整数。它们每位数字都是按照 逆序 的方式存储的，并且每个节点只能存储 一位 数字。

请你将两个数相加，并以相同形式返回一个表示和的链表。

你可以假设除了数字 0 之外，这两个数都不会以 0 开头。

思路:用一个虚拟头结点 逐位相加,考虑进位

```java
// 逐位相加,考虑进位
// 复杂度 时间:O(max(m,n));  空间:O(max(m,n))
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(-1);
        ListNode temp = dummy;
        int carry = 0;
        while(l1 != null || l2 != null){
            int a = l1 != null ? l1.val : 0;
            int b = l2 != null ? l2.val : 0;
            carry = a + b + carry;
            temp.next = new ListNode(carry % 10);
            carry /= 10;
            temp = temp.next;
            if(l1 != null) l1 = l1.next;
            if(l2 != null) l2 = l2.next;
        }
        if(carry != 0) temp.next = new ListNode(carry);
        return dummy.next;
    }
}
```







## 14 [445. 两数相加 II](https://leetcode-cn.com/problems/add-two-numbers-ii/)

题目：给你两个 非空 链表来代表两个非负整数。数字最高位位于链表开始位置。它们的每个节点只存储一位数字。将这两数相加会返回一个新的链表。

你可以假设除了数字 0 之外，这两个数字都不会以零开头。

思路：两辅助栈

代码：

```java
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        Stack<Integer> stack1 = new Stack<>();
        Stack<Integer> stack2 = new Stack<>();
        while(l1 != null){
            stack1.push(l1.val);
            l1 = l1.next;
        }
        while(l2 != null){
            stack2.push(l2.val);
            l2 = l2.next;
        }
        
        int carry = 0;  //标记是否进位
        ListNode head1 = new ListNode(-1);
        while( !stack1.isEmpty() || !stack2.isEmpty() || carry!=0){
            int sum = carry;
            sum += stack1.isEmpty() ? 0 : stack1.pop();
            sum += stack2.isEmpty() ? 0 : stack2.pop();
            ListNode node = new ListNode(sum%10);
            node.next = head1.next;		//头插法
            head1.next = node;
            carry = sum/10;
        }
        return head1.next;
    }
}
```





## 15 [328. 奇偶链表](https://leetcode-cn.com/problems/odd-even-linked-list/)

题目：给定一个单链表，把所有的奇数节点和偶数节点分别排在一起。请注意，这里的奇数节点和偶数节点指的是节点编号的奇偶性，而不是节点的值的奇偶性。

思路：三个指针，两个排序，一个标记偶数链表的头

```java
class Solution {
    public ListNode oddEvenList(ListNode head) {
        if(head == null) return head;
        ListNode odd = head;
        ListNode even = head.next;
        ListNode evenHead = even;
        while(even!= null && even.next!= null){	//偶数在后面，如果偶数有，那么奇数也有
            odd.next = odd.next.next;
            odd = odd.next;
            even.next = even.next.next;
            even = even.next;
        }
        odd.next = evenHead;
        return head;
    }
}
```



## 16 [725. 分隔链表](https://leetcode-cn.com/problems/split-linked-list-in-parts/)

给定一个头结点为 root 的链表, 编写一个函数以将链表分隔为 k 个连续的部分。

每部分的长度应该尽可能的相等: 任意两部分的长度差距不能超过 1，也就是说可能有些部分为 null。

这k个部分应该按照在链表中出现的顺序进行输出，并且排在前面的部分的长度应该大于或等于后面的长度。

返回一个符合上述规则的链表的列表。

```java
class Solution {
    public ListNode[] splitListToParts(ListNode root, int k) {
        int N = 0;
        //链表长度
        ListNode cur = root;
        while(cur != null){
            cur = cur.next;
            N++;
        }
        //每个部分的基础长度和余数
        int size = N/k;
        int mod = N%k;
        cur = root;
        ListNode[] res = new ListNode[k];
        for(int i = 0; cur != null && i < k ; i++){
            //表头加入
            res[i] = cur;
            //当前的大小取决于基础大小和是否还有余数
            int curSize = size + (mod-- > 0 ? 1:0);
            //需要得到Cursize规模的链表，需要走Cursize - 1步
            for(int j = 0 ; j < curSize - 1; j++){
                cur = cur.next;
            }
            //记录下下一个节点，断开链表
            ListNode next = cur.next;
            cur.next = null;
            cur = next;
        }
        return res;
    }
}
```





## 17 [21. 合并两个有序链表](https://leetcode-cn.com/problems/merge-two-sorted-lists/) *

题目：将两个升序链表合并为一个新的 升序 链表并返回。新链表是通过拼接给定的两个链表的所有节点组成的。

递归解法：

终止条件：两条链表分别名为 l1 和 l2，当 l1 为空或 l2 为空时结束

返回值：每一层调用都返回排序好的链表头

本级递归内容：如果 l1 的 val 值更小，则将 l1.next 与排序好的链表头相接，l2 同理


```java
// 递归  时间 O(n+m)  空间 O(n+m)
class Solution {
    public ListNode mergeTwoLists(ListNode l1, ListNode l2) {
        if(l1 == null) {
            return l2;
        }
        if(l2 == null) {
            return l1;
        }    

		if(l1.val < l2.val) {
        	l1.next = mergeTwoLists(l1.next, l2);
        	return l1;
    	} else {
        	l2.next = mergeTwoLists(l1, l2.next);
        	return l2;
    }
}
  
// 迭代  时间 O(n+m)  空间 O(1)
class Solution {
    public ListNode mergeTwoLists(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(-1);
        ListNode pre = dummy;
        while (l1 != null && l2 != null) {
            if (l1.val <= l2.val){
                pre.next = l1;
                l1 = l1.next;
            } else {
                pre.next = l2;
                l2 = l2.next;
            }
            pre = pre.next;

        }
        pre.next = l1 == null ? l2 : l1;
        return dummy.next;
    }
}
```

## 18 [23. 合并K个升序链表](https://leetcode-cn.com/problems/merge-k-sorted-lists/) *

给你一个链表数组，每个链表都已经按升序排列。

请你将所有链表合并到一个升序链表中，返回合并后的链表。

```java
// 最小堆
// 时间: O(kn×logk)  k 个链表,kn 个点
// 空间: O(k)
// 堆排序,使用大顶堆可以得到升序的
class Solution {
    public ListNode mergeKLists(ListNode[] lists) {
        // 哨兵节点
        ListNode dummy = new ListNode(-1), tail = dummy;
        //优先队列，每次出堆的都是最小的  小顶堆,输出根节点
        PriorityQueue<ListNode> q = new PriorityQueue<>((a, b) -> a.val - b.val);
        // 入队
        for(ListNode node : lists) {
            if(node != null) q.add(node);
        }
        while(!q.isEmpty()) {
            tail.next = q.poll();
            tail = tail.next;
            if(tail.next != null) {
                q.add(tail.next);
            }
        }
        return dummy.next;
    }
}
```

```java
// 分治实现
// 时间 O(kn×logk)
// 空间 O(logk)
class Solution {
   public ListNode mergeKLists(ListNode[] lists) {
        if (lists == null || lists.length == 0) return null;
        return merge(lists, 0, lists.length - 1);
    }
	//分治实现两两合并
    private ListNode merge(ListNode[] lists, int left, int right) {
        if (left == right) return lists[left];
        int mid = left + (right - left) / 2;
        ListNode l1 = merge(lists, left, mid);
        ListNode l2 = merge(lists, mid + 1, right);
        return mergeTwoLists(l1, l2);
    }
  
  
	//合并两个有序
    private ListNode mergeTwoLists(ListNode l1, ListNode l2) {
        if (l1 == null) return l2;
        if (l2 == null) return l1;
        if (l1.val < l2.val) {
            l1.next = mergeTwoLists(l1.next, l2);
            return l1;
        } else {
            l2.next = mergeTwoLists(l1,l2.next);
            return l2;
        }
    }
}
```



## 19 [234. 回文链表](https://leetcode-cn.com/problems/palindrome-linked-list/) important

请判断一个链表是否为回文链表。

```java
class Solution {
    public boolean isPalindrome(ListNode head) {
        //只有一个或者两个
        if(head == null || head.next == null) return true;
        ListNode slow = head,fast = head.next;
        //找出中点
        while(fast!= null && fast.next != null){
            slow = slow.next;
            fast = fast.next.next;
        }
        //考虑只有两个元素的情况
        if(fast != null) slow = slow.next;
        cut(head,slow);
        return isequal(head,reverse(slow));

    }
	//断开链表，断在slow前
    private void cut(ListNode head,ListNode slow){
        while(head.next != slow){
            head = head.next;
        }
        head.next = null;
    }
	
    //反转链表
    private  ListNode reverse(ListNode head){
        if(head == null || head.next == null) return head;
        ListNode cur = reverse(head.next);
        head.next.next = head;
        head.next = null;
        return cur;
    }
	
    //判断是否相等
    private boolean isequal(ListNode l1,ListNode l2){
        //忽略奇数个节点情况
        while(l1 != null && l2 != null){
            if(l1.val != l2.val){
                return false;
            }
                l1 = l1.next;
                l2 = l2.next;    
        }
        return true;
    }
}
```



## 20 [86. 分隔链表](https://leetcode-cn.com/problems/partition-list/)  important

给你一个链表的头节点 head 和一个特定值 x ，请你对链表进行分隔，使得所有 小于 x 的节点都出现在 大于或等于 x 的节点之前。

你应当 保留 两个分区中每个节点的初始相对位置。

```java
class Solution {
    public ListNode partition(ListNode head, int x) {
        ListNode dummy1 = new ListNode(0);
        ListNode dummy2 = new ListNode(0);
        ListNode node1 = dummy1, node2 = dummy2;
        while (head != null){
            if (head.val < x){
                node1.next = head;
                head = head.next;
                node1 = node1.next;
                //断开与主链表的联系
                node1.next = null;
            } else {
                node2.next = head;
                head = head.next;
                node2 = node2.next;
                node2.next = null;
            }
        }
        node1.next = dummy2.next;
        return dummy1.next;
    }
}
```



## 21 剑指46.圆圈中最后剩下的数 ###

每年六一儿童节,牛客都会准备一些小礼物去看望孤儿院的小朋友,今年亦是如此。HF作为牛客的资深元老,自然也准备了一些小游戏。其中,有个游戏是这样的:首先,让小朋友们围成一个大圈。然后,他随机指定一个数m,让编号为0的小朋友开始报数。每次喊到m-1的那个小朋友要出列唱首歌,然后可以在礼品箱中任意的挑选礼物,并且不再回到圈中,从他的下一个小朋友开始,继续0...m-1报数....这样下去....直到剩下最后一个小朋友,可以不用表演,并且拿到牛客名贵的“名侦探柯南”典藏版(名额有限哦!!^_^)。请你试着想下,哪个小朋友会得到这份礼品呢？(注：小朋友的编号是从0到n-1) 

如果没有小朋友，请返回-1 

思路：

使用List模拟，使用一个指针。

```java
public class Solution {
    public int LastRemaining_Solution(int n, int m) {
        if(n == 0 || m == 0) return -1;
        LinkedList<Integer> list = new LinkedList<>();
        for(int i = 0; i < n; i++) list.add(i);
        int cur = -1;
        while(list.size()>1){
            for(int i = 0; i < m; i++){
                cur++;
                if(cur == list.size()) cur = 0;
            }
            list.remove(cur);
            //删除节点时，cur会指向下一个节点，因此需要减1。
            cur--;
        }
        return list.get(0);
    }
}
```

## 22 853.链表的中间结点  important

[https://leetcode-cn.com/problems/middle-of-the-linked-list/](https://leetcode-cn.com/problems/middle-of-the-linked-list/)

```java
// 双指针（快慢）
class Solution {
    public ListNode middleNode(ListNode head) {
        ListNode p = head, q = head;
        while (q != null && q.next != null) {
            q = q.next.next;
            p = p.next;
        }
        return p;
    }
}
```

## 23 [24. 两两交换链表中的节点](https://leetcode.cn/problems/swap-nodes-in-pairs/) *

给你一个链表，两两交换其中相邻的节点，并返回交换后链表的头节点。你必须在不修改节点内部的值的情况下完成本题（即，只能进行节点交换）。

```java
class Solution {
    public ListNode swapPairs(ListNode head) {
        ListNode pre = new ListNode(0);
        pre.next = head;
        ListNode temp = pre;
        // temp -> start -> end
        // temp 是要交换的两个的前一个
        while(temp.next != null && temp.next.next != null) {
            ListNode start = temp.next;
            ListNode end = temp.next.next;
            temp.next = end;
            start.next = end.next;
            end.next = start;
            // 交换完成,此时 start 后面是需要交换的
            temp = start;
        }
        return pre.next;
    }
}

 // 递归解法
class Solution {
    public ListNode swapPairs(ListNode head) {
        // 当前无节点或者只有一个节点，无法进行交换
        if(head == null || head.next == null){
            return head;
        }
        // head -> next -> (next.next)
        ListNode next = head.next;
        head.next = swapPairs(next.next);
        next.next = head;
        return next;
    }
}
```



## 24 奇数位升序偶数位降序的链表  important

```java
public static ListNode oddEvenLinkedList(ListNode head) {
    // 将偶数链表拆分出来
    ListNode evenHead = getEvenList(head);
    // 逆序偶数链表
    ListNode reEvenHead = reverseList(evenHead);
    // 归并奇偶链表
    ListNode mHead = mergeList(head, reEvenHead);
    return mHead;
} 

public static ListNode getEvenList(ListNode head) {
    ListNode cur = head;
    ListNode next = null;
    ListNode evenHead = head.next;
    while (cur != null && cur.next != null) {
        // 获取next
        next = cur.next;
        // cur奇数，-> next.next (奇数)
        cur.next = next.next;
        // 移动
        cur = cur.next;

        // 开始偶数
        next.next = cur.next;
        // 移动
        next = next.next;
    }
    return evenHead;
}

public static ListNode reverseList(ListNode head) {
    ListNode pre = null;
    ListNode cur = head;
    while (cur != null) {
        ListNode next = cur.next;
        cur.next = pre;
        pre = cur;
        cur = next;
    }
    return pre;
}

public static ListNode mergeList(ListNode l1, ListNode l2){
    // 我用递归
    if (l1 == null) 
        return l2;
    if (l2 == null)
        return l1;
    if (l1.val < l2.val) {
        l1.next = mergeList(l1.next, l2);
        return l1;
    } else {
        l2.next = mergeList(l1, l2.next);
        return l2;
    }
}
```
