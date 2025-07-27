---
title: "[Algorithm] Tree"
published: 2021-06-12
tags:
  - Algorithm
lang: zh
toc: true
abbrlink: algorithm-tree
---
<!--more-->

```java
/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode(int x) { val = x; }
 * }
 */
void traverse(TreeNode root) {
    if (root == null) {
        return;
    }
    // 前序位置  进入节点的时候 
    traverse(root.left);
    // 中序位置	左子树遍历完成
    traverse(root.right);
    // 后序位置  离开节点的时候
}
// 遍历一遍二叉树得出答案  
// 通过分解问题计算出答案 定义递归函数完成
// 只有后序位置才能通过返回值获取子树的信息。
// 二叉树的所有问题，就是让你在前中后序位置注入巧妙的代码逻辑，
// 去达到自己的目的，你只需要单独思考每一个节点应该做什么
```



[toc]

## 1 遍历

### 1.1 前序遍历

思路：根节点->左子树->右子树

```java
class Solution {
    List<Integer> res = new ArrayList<>();
    public List<Integer> preorderTraversal(TreeNode root) {
        if(root != null) {
            res.add(root.val);
            preorderTraversal(root.left);
            preorderTraversal(root.right);
        }
        return res;
    }
}
//非递归，用栈实现，先访问父节点，先压右再压左
class Solution {
    public List<Integer> preorderTraversal(TreeNode root) {
        List<Integer> res = new ArrayList<>();
        if(root == null) return res;
        Deque<TreeNode> stack = new LinkedList<>();
        stack.push(root);
        while(!stack.isEmpty()) {
            TreeNode node = stack.pop();
            res.add(node.val);
            // 倒过来，因为栈后面压入先出
            if(node.right != null) stack.push(node.right);
            if(node.left != null) stack.push(node.left);
        }
        return res;
    }
}
```



### 1.2 中序遍历

思路：左子树->根节点->右子树

```java
class Solution {
    List<Integer> res = new ArrayList<>();
    public List<Integer> inorderTraversal(TreeNode root) {
        if(root != null) {
            inorderTraversal(root.left);
            res.add(root.val);
            inorderTraversal(root.right);
        }
        return res;

    }
}
//非递归 先压左节点，然后从最后一个左节点开始访问，如果有右节点则访问
class Solution {
    public List<Integer> inorderTraversal(TreeNode root) {
        List<Integer> res = new ArrayList<>();
        Deque<TreeNode> stack = new LinkedList<>();
        //中序遍历结束的条件是栈空，并且树中全部节点都已经被压入栈
        while(stack.size() > 0 || root != null){	
            //从root开始，将root的左节点全部压入
            //这里是为了剔除右节点为空的情况
            if(root != null){			
                stack.push(root);
                root = root.left;
            }else{						//压入后，从最左开始访问
                TreeNode node = stack.pop();
                res.add(node.val);
                root = node.right;		//如果有右节点，那么将在下一个循环中被压入栈
            }
        }
        return res;       
    }
}
```

### 1.3 后序遍历

思路：左子树->右子树->根节点

```java
//递归的比较简单

//非递归，可以将前序修改成根右左，倒序就是后序遍历
class Solution {
    public List<Integer> postorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        if(root == null) return result;
        Deque<TreeNode> stack = new LinkedList<>();
        stack.push(root);
        while(!stack.isEmpty()){
            TreeNode node = stack.pop();
            result.add(node.val); 		//根节点
            if(node.left != null) stack.push(node.left);	//先压左再压右
            if(node.right != null) stack.push(node.right);
        }
        Collections.reverse(result);	//倒序结果
        return result;
    }
}
```

### 1.4 [987. 二叉树的垂序遍历](https://leetcode.cn/problems/vertical-order-traversal-of-a-binary-tree/)

```java
class Solution {
    // 记录每个节点和对应的坐标 (row, col)
    class Triple {
        public int row, col;
        public TreeNode node;

        public Triple(TreeNode node, int row, int col) {
            this.node = node;
            this.row = row;
            this.col = col;
        }
    }

    public List<List<Integer>> verticalTraversal(TreeNode root) {
        // 遍历二叉树，并且为所有节点生成对应的坐标
        traverse(root, 0, 0);
        // 根据题意，根据坐标值对所有节点进行排序：
        // 按照 col 从小到大排序，col 相同的话按 row 从小到大排序，
        // 如果 col 和 row 都相同，按照 node.val 从小到大排序。
        Collections.sort(nodes, (Triple a, Triple b) -> {
            if (a.col == b.col && a.row == b.row) {
                return a.node.val - b.node.val;
            }
            if (a.col == b.col) {
                return a.row - b.row;
            }
            return a.col - b.col;
        });
        // 将排好序的节点组装成题目要求的返回格式
        LinkedList<List<Integer>> res = new LinkedList<>();
        // 记录上一列编号，初始化一个特殊值
        int preCol = Integer.MIN_VALUE;
        for (int i = 0; i < nodes.size(); i++) {
            Triple cur = nodes.get(i);
            if (cur.col != preCol) {
                // 开始记录新的一列
                res.addLast(new LinkedList<>());
                preCol = cur.col;
            }
            res.getLast().add(cur.node.val);
        }

        return res;
    }

    ArrayList<Triple> nodes = new ArrayList<>();
    // 二叉树遍历函数，记录所有节点对应的坐标
    void traverse(TreeNode root, int row, int col) {
        if (root == null) {
            return;
        }
        // 记录坐标
        nodes.add(new Triple(root, row, col));
        // 二叉树遍历框架
        traverse(root.left, row + 1, col - 1);
        traverse(root.right, row + 1, col + 1);
    }
}
```

### 1.5 [236. 二叉树的最近公共祖先](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/)

给定一个二叉树, 找到该树中两个指定节点的最近公共祖先。

```java
//如果root是最近的公共祖先，那么有三种情况：
//p和q在root的左右子树中；p=root，q在p的子树中；q=root，p在q的子树中
//递归对二叉树进行后序遍历：（左右中）遇到p或q返回
class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        //中止条件：越过了叶子节点或者找到了p或q
        if(root == null || root == p || root == q) return root;
        TreeNode left = lowestCommonAncestor(root.left, p, q);
        TreeNode right = lowestCommonAncestor(root.right, p, q);
        //如果都为空，都没有，返回
        //都不空，返回root
        //有一个空，另一个就是最近公共祖先
        if(left == null) return right;
        if(right == null) return left;
        return root;
    }
}
```

### 1.6 [993. 二叉树的堂兄弟节点](https://leetcode.cn/problems/cousins-in-binary-tree/)

如果二叉树的两个节点深度相同，但 父节点不同 ，则它们是一对堂兄弟节点。

```java
class Solution {
    TreeNode parentX = null;
    TreeNode parentY = null;
    int depthX = 0, depthY = 0;
    int x, y;

    public boolean isCousins(TreeNode root, int x, int y) {
        this.x = x;
        this.y = y;
        traverse(root, 0, null);
        if (depthX == depthY && parentX != parentY) {
            // 判断 x，y 是否是表兄弟节点
            return true;
        }
        return false;
    }

    public void traverse(TreeNode root, int depth, TreeNode parent) {
        if (root == null) {
            return;
        }
        if (root.val == x) {
            // 找到 x，记录它的深度和父节点
            parentX = parent;
            depthX = depth;
        }
        if (root.val == y) {
            // 找到 y，记录它的深度和父节点
            parentY = parent;
            depthY = depth;
        }
        traverse(root.left, depth + 1, root);
        traverse(root.right, depth + 1, root);
    }
}
```

### 1.7 二叉树的下一个节点

给定二叉树其中的一个结点，请找出其中序遍历顺序的下一个结点并且返回。

```java
//中序遍历
public class Solution {
    List<TreeLinkNode> list = new ArrayList<>();
    public TreeLinkNode GetNext(TreeLinkNode pNode)
    {
        if(pNode == null) return null;
        TreeLinkNode root = pNode;
        // 找到父节点
        while(root.next != null){
            root = root.next;
        }
        inorder(root);
        for(int i = 0; i < list.size()-1; i ++){
            if(list.get(i) == pNode) return list.get(i+1);
        }
        return null;
    }
    private void inorder(TreeLinkNode root){
        if(root == null) return;
        inorder(root.left);
        list.add(root);
        inorder(root.right);
    }
}

//如果有右子树，则找右子树的最左节点
//没右子树
//若x是父节点的左孩子。则x的父节点就是x的下一个节点。
//若x是父节点的右孩子。则沿着父节点向上，直到找到一个节点的父节点的左孩子是该节点，
//则该节点的父节点就是x的下一个节点
```

### 1.8 [剑指 Offer 07. 重建二叉树](https://leetcode.cn/problems/zhong-jian-er-cha-shu-lcof/)

输入某二叉树的前序遍历和中序遍历的结果，请构建该二叉树并返回其根节点。

```java
//前序第一个是根节点，而在中序的该值的左边是左子树，右边是右子树
class Solution {
    public TreeNode buildTree(int[] preorder, int[] inorder) {
        if(preorder.length == 0 || inorder.length == 0){
            return null;
        }
        TreeNode root = new TreeNode(preorder[0]);
        for(int i = 0; i < inorder.length; i++){
            if(preorder[0] == inorder[i]){
                root.left = buildTree(Arrays.copyOfRange(preorder,1,i+1),Arrays.copyOfRange(inorder,0,i));
                root.right = buildTree(Arrays.copyOfRange(preorder,i+1,preorder.length),Arrays.copyOfRange(inorder,i+1,inorder.length));
                break;
            }
        }
        return root;
    }
}
//Arrays.copyOfRange(T[ ] original,int from,int to)将一个原始的数组original，从下标from开始复制，复制到上标to，生成一个新的数组。注意这里包括下标from，不包括上标to。
class Solution {
    int[] preorder;
    //可以用来查找根节点在中序中的对应位置
    HashMap<Integer, Integer> dic = new HashMap<>();
    public TreeNode buildTree(int[] preorder, int[] inorder) {
        this.preorder = preorder;
        for(int i = 0; i < inorder.length; i++)
            dic.put(inorder[i], i);
        return recur(0, 0, inorder.length - 1);
    }
    //root是根节点在前序中的位置，left，right是中序遍历中的边界
    TreeNode recur(int root, int left, int right) {
        if(left > right) return null;                          // 递归终止
        TreeNode node = new TreeNode(preorder[root]);          // 建立根节点
        //找到左右子树的划分点
        int i = dic.get(preorder[root]);                       // 划分根节点、左子树、右子树
        //左子树的根节点，左边界不变
        node.left = recur(root + 1, left, i - 1);              // 开启左子树递归
        //右子树的根节点就是根节点加上左子树长度加一
        node.right = recur(root + i - left + 1, i + 1, right); // 开启右子树递归
        return node;                                           // 回溯返回根节点
    }
}
```

### 1.9 [106. 从中序与后序遍历序列构造二叉树](https://leetcode.cn/problems/construct-binary-tree-from-inorder-and-postorder-traversal/)

给定两个整数数组 inorder 和 postorder ，其中 inorder 是二叉树的中序遍历， postorder 是同一棵树的后序遍历，请你构造并返回这颗 二叉树 。

```java
class Solution {
    // 存储 inorder 中值到索引的映射
    HashMap<Integer, Integer> valToIndex = new HashMap<>();

    public TreeNode buildTree(int[] inorder, int[] postorder) {
        for (int i = 0; i < inorder.length; i++) {
            valToIndex.put(inorder[i], i);
        }
        return build(inorder, 0, inorder.length - 1,
                    postorder, 0, postorder.length - 1);
    }

    /*
       定义：
       中序遍历数组为 inorder[inStart..inEnd]，
       后序遍历数组为 postorder[postStart..postEnd]，
       构造这个二叉树并返回该二叉树的根节点
    */
    TreeNode build(int[] inorder, int inStart, int inEnd,
                int[] postorder, int postStart, int postEnd) {

        if (inStart > inEnd) {
            return null;
        }
        // root 节点对应的值就是后序遍历数组的最后一个元素
        int rootVal = postorder[postEnd];
        // rootVal 在中序遍历数组中的索引
        int index = valToIndex.get(rootVal);
        // 左子树的节点个数
        int leftSize = index - inStart;
        TreeNode root = new TreeNode(rootVal);
        // 递归构造左右子树
        root.left = build(inorder, inStart, index - 1,
                         postorder, postStart, postStart + leftSize - 1);
        
        root.right = build(inorder, index + 1, inEnd,
                          postorder, postStart + leftSize, postEnd - 1);
        return root;
    }
}
```



### 1.10 [257. 二叉树的所有路径](https://leetcode.cn/problems/binary-tree-paths/)

给你一个二叉树的根节点 root ，按 任意顺序 ，返回所有从根节点到叶子节点的路径。

```java
class Solution {
    public List<String> binaryTreePaths(TreeNode root) {
        List<String> list = new ArrayList<>();
        helper(root,"",list);
        return list;

    }

    private void helper(TreeNode root,String path,List<String> list){  //前序遍历，根->左->右
        if(root == null)   return;
        path += Integer.toString(root.val);
        if((root.left == null) && (root.right == null)){  //如果到底了，复制path，加入答案
            list.add(path.toString());
        }else{
            path += "->";
            helper(root.left,path,list);
            helper(root.right,path,list);
        }
    }
}
```

### 1.11 [297. 二叉树的序列化与反序列化](https://leetcode.cn/problems/serialize-and-deserialize-binary-tree/)

```java
public class Codec {
    String SEP = ",";
    String NULL = "#";

    /* 主函数，将二叉树序列化为字符串 */
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        serialize(root, sb);
        return sb.toString();
    }

    /* 辅助函数，将二叉树存入 StringBuilder */
    void serialize(TreeNode root, StringBuilder sb) {
        if (root == null) {
            sb.append(NULL).append(SEP);
            return;
        }
        /******前序遍历位置******/
        sb.append(root.val).append(SEP);
        serialize(root.left, sb);
        serialize(root.right, sb);
    }

    /* 主函数，将字符串反序列化为二叉树结构 */
    public TreeNode deserialize(String data) {
        // 将字符串转化成列表
        LinkedList<String> nodes = new LinkedList<>();
        for (String s : data.split(SEP)) {
            nodes.addLast(s);
        }
        return deserialize(nodes);
    }

    /* 辅助函数，通过 nodes 列表构造二叉树 */
    TreeNode deserialize(LinkedList<String> nodes) {
        if (nodes.isEmpty()) return null;
        /******前序遍历位置******/
        // 列表最左侧就是根节点
        String first = nodes.removeFirst();
        if (first.equals(NULL)) return null;
        TreeNode root = new TreeNode(Integer.parseInt(first));
        // 会把左子树的元素全部移除
        root.left = deserialize(nodes);
        root.right = deserialize(nodes);
        return root;
    }
}
```



### 1.12 [124. 二叉树中的最大路径和](https://leetcode.cn/problems/binary-tree-maximum-path-sum/)

给你一个二叉树的根节点 root ，返回其 最大路径和 。

```java
// 在后序遍历的时候顺便计算题目要求的最大路径和。
class Solution {
    int res = Integer.MIN_VALUE;

    public int maxPathSum(TreeNode root) {
        if (root == null) {
            return 0;
        }
        // 计算单边路径和时顺便计算最大路径和
        oneSideMax(root);
        return res;
    }

    // 定义：计算从根节点 root 为起点的最大单边路径和
    int oneSideMax(TreeNode root) {
        if (root == null) {
            return 0;
        }
        int leftMaxSum = Math.max(0, oneSideMax(root.left));
        int rightMaxSum = Math.max(0, oneSideMax(root.right));
        // 后序遍历位置，顺便更新最大路径和
        int pathMaxSum = root.val + leftMaxSum + rightMaxSum;
        res = Math.max(res, pathMaxSum);
        // 实现函数定义，左右子树的最大单边路径和加上根节点的值
        // 就是从根节点 root 为起点的最大单边路径和
        return Math.max(leftMaxSum, rightMaxSum) + root.val;
    }
}
```

### 1.13 [114. 二叉树展开为链表](https://leetcode.cn/problems/flatten-binary-tree-to-linked-list/)

给你二叉树的根结点 root ，请你将它展开为一个单链表

```java
class Solution {
    // 定义：将以 root 为根的树拉平为链表
    public void flatten(TreeNode root) {
        // base case
        if (root == null) return;
        // 先递归拉平左右子树
        flatten(root.left);
        flatten(root.right);

        /****后序遍历位置****/
        // 1、左右子树已经被拉平成一条链表
        TreeNode left = root.left;
        TreeNode right = root.right;

        // 2、将左子树作为右子树
        root.left = null;
        root.right = left;

        // 3、将原先的右子树接到当前右子树的末端
        TreeNode p = root;
        while (p.right != null) {
            p = p.right;
        }
        p.right = right;
    }
}
```

### 1.14 [623. 在二叉树中增加一行](https://leetcode.cn/problems/add-one-row-to-tree/)

```java
class Solution {
    private int targetVal, targetDepth;

    public TreeNode addOneRow(TreeNode root, int val, int depth) {
        targetVal = val;
        targetDepth = depth;
        // 插入到第一行的话特殊对待一下
        if (targetDepth == 1) {
            TreeNode newRoot = new TreeNode(targetVal);
            newRoot.left = root;
            return newRoot;
        }
        // 遍历二叉树，走到对应行进行插入
        traverse(root);

        return root;
    }

    private int curDepth = 0;

    void traverse(TreeNode root) {
        if (root == null) {
            return;
        }
        // 前序遍历
        curDepth++;
        if (curDepth == targetDepth - 1) {
            // 进行插入
            TreeNode newLeft = new TreeNode(targetVal);
            TreeNode newRight = new TreeNode(targetVal);
            newLeft.left = root.left;
            newRight.right = root.right;
            root.left = newLeft;
            root.right = newRight;
        }

        traverse(root.left);
        traverse(root.right);

        // 后序遍历
        curDepth--;
    }
}
```

### 1.15 [654. 最大二叉树](https://leetcode.cn/problems/maximum-binary-tree/)

```java
class Solution {
    /* 主函数 */
    public TreeNode constructMaximumBinaryTree(int[] nums) {
        return build(nums, 0, nums.length - 1);
    }

    /* 定义：将 nums[lo..hi] 构造成符合条件的树，返回根节点 */
    TreeNode build(int[] nums, int lo, int hi) {
        // base case
        if (lo > hi) {
            return null;
        }

        // 找到数组中的最大值和对应的索引
        int index = -1, maxVal = Integer.MIN_VALUE;
        for (int i = lo; i <= hi; i++) {
            if (maxVal < nums[i]) {
                index = i;
                maxVal = nums[i];
            }
        }

        TreeNode root = new TreeNode(maxVal);
        // 递归调用构造左右子树
        root.left = build(nums, lo, index - 1);
        root.right = build(nums, index + 1, hi);

        return root;
    }
}
```

### 1.16 [814. 二叉树剪枝](https://leetcode.cn/problems/binary-tree-pruning/)

给你二叉树的根结点 root ，此外树的每个结点的值要么是 0 ，要么是 1 。

返回移除了所有不包含 1 的子树的原二叉树。

```java
class Solution {
    // 定义：输入一棵二叉树，返回的二叉树叶子节点都是 1
    public TreeNode pruneTree(TreeNode root) {
        if (root == null) {
            return null;
        }
        // 二叉树递归框架
        root.left = pruneTree(root.left);
        root.right = pruneTree(root.right);

        // 后序遍历位置，判断自己是否是值为 0 的叶子节点
        if (root.val == 0 && root.left == null && root.right == null) {
            // 返回值会被父节点接收，相当于把自己删掉了
            return null;
        }
        // 如果不是，正常返回
        return root;
    }
}
```

## 2 层序遍历

### 2.1 [102. 二叉树的层序遍历](https://leetcode.cn/problems/binary-tree-level-order-traversal/)

```java
class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> res = new LinkedList<>();
        if(root == null) return res;
        Queue<TreeNode> q = new LinkedList<>();
        q.offer(root);
        while(!q.isEmpty()) {
            int size = q.size();
            // 记录当前层的节点，并将下一层的入队
            List<Integer> level = new LinkedList<>();
            for(int i = 0; i < size; i++) {
                TreeNode cur = q.poll();
                level.add(cur.val);
                if (cur.left != null)
                    q.offer(cur.left);
                if (cur.right != null)
                    q.offer(cur.right);
            }
            res.add(level);
        }
        return res;
    }
}
```

### 2.2 [103. 二叉树的锯齿形层序遍历](https://leetcode.cn/problems/binary-tree-zigzag-level-order-traversal/)

即先从左往右，再从右往左进行下一层遍历，以此类推，层与层之间交替进行

```java
class Solution {
    public List<List<Integer>> zigzagLevelOrder(TreeNode root) {
        List<List<Integer>> res = new ArrayList<>();
        Queue<TreeNode>  queue = new LinkedList<>();
        if(root != null){
            queue.offer(root);
        }
        //设置标记，记录顺序
        boolean flag = true;
        while(!queue.isEmpty()){   
            List<Integer> level = new ArrayList<Integer>();
            int n = queue.size();
            for(int i = 0 ; i < n ; i++){
                TreeNode node = queue.poll();
                if(flag){
                    level.add(node.val);
                }else{
                    // 倒过来添加到队列里面
                    level.add(0,node.val);
                }
                if(node.left != null) queue.offer(node.left);
                if(node.right != null) queue.offer(node.right);
            }
            res.add(level);
            flag = !flag;
        }
        return res;
    }
}
```

### 2.3 [662. 二叉树最大宽度](https://leetcode.cn/problems/maximum-width-of-binary-tree/)

给你一棵二叉树的根节点 root ，返回树的 **最大宽度** 。

```java
//根据完全二叉树的概念，i位置节点的左子节点位置为2i，右子节点位置为2i+1；
//通过一个list记录节点对应的完全二叉树中的位置
//按层BFS二叉树，记录下list中每一层的前后位置之差，返回最大
class Solution {
    public int widthOfBinaryTree(TreeNode root) {
        if(root == null) return 0;
        //节点队列
        Queue<TreeNode> queue = new LinkedList<>();		   
        //节点位置队列
        LinkedList<Integer> res = new LinkedList<>();
        queue.offer(root);
        res.add(1);
        int ans = 1;
        while(!queue.isEmpty()){
            int size = queue.size();
            for(int i = 0;i < size;i++){
                TreeNode node = queue.poll();
                Integer cur = res.removeFirst();
                // 相应的位置也加入辅助队列
                if(node.left != null){
                    queue.offer(node.left);
                    res.add(cur*2);
                }
                if(node.right != null){
                    queue.offer(node.right);
                    res.add(cur * 2 + 1);
                }
            }
            // 更新最大宽度
            if(res.size() >= 2){
                ans = Math.max(ans,res.getLast() - res.getFirst() + 1);
            }
        }
        return ans;    
    }
}
```



### 2.4 [958. 二叉树的完全性检验](https://leetcode.cn/problems/check-completeness-of-a-binary-tree/)

给定一个二叉树的 root ，确定它是否是一个 *完全二叉树* 。

```java
//层序遍历，判断是否出现过null
//通过一个 flag 进行记录
class Solution {
    public boolean isCompleteTree(TreeNode root) {
        if(root == null) return true;
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        boolean flag = false;		//判断是否出现过null
        while(!queue.isEmpty()){
            int size = queue.size();
            for(int i = 0; i < size ; i++){
                TreeNode node = queue.poll();
                if(node != null){	//如果当前节点不是null
                    if(flag) return false;	//如果之前出现就直接返回
                    queue.add(node.left);	//不管有没有子节点，都加入
                    queue.add(node.right);
                }else{				
                    flag = true;
                }
            }
        }
        return true;
    }
}
```

### 2.5 [222. 完全二叉树的节点个数](https://leetcode.cn/problems/count-complete-tree-nodes/)

给你一棵 完全二叉树 的根节点 root ，求出该树的节点个数。

```java
class Solution {
    public int countNodes(TreeNode root) {
        if(root == null){
           return 0;
        } 
        int left = countLevel(root.left);
        int right = countLevel(root.right);
        // 层数一样，左边满，不一样，右边满
        if(left == right){
            // 位运算 2^left
            return countNodes(root.right) + (1<<left);
        }else{
            return countNodes(root.left) + (1<<right);
        }
    }
    private int countLevel(TreeNode root){
        int level = 0;
        while(root != null){
            level++;
            root = root.left;
        }
        return level;
    }
}
```

### 2.6 [199. 二叉树的右视图](https://leetcode.cn/problems/binary-tree-right-side-view/)

给定一个二叉树的 根节点 root，想象自己站在它的右侧，按照从顶部到底部的顺序，返回从右侧所能看到的节点值。

```java
class Solution {

    /* BFS 层序遍历解法 */
    public List<Integer> rightSideView(TreeNode root) {
        List<Integer> res = new LinkedList<>();
        if (root == null) {
            return res;
        }
        // BFS 层序遍历，计算右侧视图
        Queue<TreeNode> q = new LinkedList<>();
        q.offer(root);
        // while 循环控制从上向下一层层遍历
        while (!q.isEmpty()) {
            int sz = q.size();
            // 每一层头部就是最右侧的元素
            TreeNode last = q.peek();
            for (int i = 0; i < sz; i++) {
                TreeNode cur = q.poll();
                // 控制每一层从右向左遍历
                if (cur.right != null) {
                    q.offer(cur.right);
                }
                if (cur.left != null) {
                    q.offer(cur.left);
                }
            }
            // 每一层的最后一个节点就是二叉树的右侧视图
            res.add(last.val);
        }
        return res;
    }

    /* DFS 递归遍历解法 */
    List<Integer> res = new ArrayList<>();
    // 记录递归的层数
    int depth = 0;

    public List<Integer> rightSideView_DFS(TreeNode root) {
        traverse(root);
        return res;
    }

    // 二叉树遍历函数
    void traverse(TreeNode root) {
        if (root == null) {
            return;
        }
        // 前序遍历位置
        depth++;
        if (res.size() < depth) {
            // 这一层还没有记录值
            // 说明 root 就是右侧视图的第一个节点
            res.add(root.val);
        }
        // 注意，这里反过来，先遍历右子树再遍历左子树
        // 这样首先遍历的一定是右侧节点
        traverse(root.right);
        traverse(root.left);
        // 后序遍历位置
        depth--;
    }
}
```

## 3 递归

### 3.1 [112. 路径总和](https://leetcode.cn/problems/path-sum/)

给你二叉树的根节点 root 和一个表示目标和的整数 targetSum 。判断该树中是否存在 根节点到叶子节点 的路径，这条路径上所有节点值相加等于目标和 targetSum 。如果存在，返回 true ；否则，返回 false 。

```java
class Solution {
    public boolean hasPathSum(TreeNode root, int sum) {
        if(root == null) return false;	//为空节点，false
        if(root.left == null && root.right == null && root.val == sum){ //当路径总和等于目标且为叶子节点时，true
            return true;
        }
        return hasPathSum(root.left,sum - root.val) || hasPathSum(root.right,sum - root.val);
    }  //从当前节点的左右继续往下递归，目标值减去当前节点值
}
```



### 3.2 [113. 路径总和 II](https://leetcode.cn/problems/path-sum-ii/)

给你二叉树的根节点 root 和一个整数目标和 targetSum ，找出所有 **从根节点到叶子节点** 路径总和等于给定目标和的路径。

```java
public class Solution {
    public List<List<Integer>> pathSum(TreeNode root, int sum) {
        List<List<Integer>> res = new ArrayList<>();
        if (root == null) {
            return res;
        }

        // Java 文档中 Stack 类建议使用 Deque 代替 Stack，注意：只使用栈的相关接口
        Deque<Integer> path = new ArrayDeque<>();
        dfs(root, sum, path, res);
        return res;
    }

     public void pathSum(TreeNode node, int sum, Deque<Integer> path, List<List<Integer>> res) {
        // 递归终止条件 1：遇到空结点不再递归调用
        if (node == null) {
            return;
        }

        // 沿途结点必须选择，这个时候要做两件事：1、sum 减去这个结点的值；2、添加到 path 里
        sum -= node.val;
        path.addLast(node.val);

        // 递归终止条件 2：遇到叶子结点，sum 恰好为 0，说明从根结点到叶子结点的路径是一个符合要求的解
        if (sum == 0 && node.left == null && node.right == null) {
            // path 全局只有一份，必须做拷贝
            res.add(new ArrayList<>(path));
            // 注意：这里 return 之前必须重置
            path.removeLast();
            return;
        }

        pathSum(node.left, sum, path, res);
        pathSum(node.right, sum, path, res);
        // 递归完成以后，必须重置变量
        path.removeLast();
    }
}
}
public List<List<Integer>> pathSum(TreeNode root, int sum) {
    List<List<Integer>> result = new ArrayList<>();
    dfs(root, sum, new ArrayList<>(), result);
    return result;
}

public void dfs(TreeNode root, int sum, List<Integer> list,
                List<List<Integer>> result) {
    //如果节点为空直接返回
    if (root == null)
        return;
    //因为list是引用传递，为了防止递归的时候分支污染，我们要在每个路径
    //中都要新建一个subList
    List<Integer> subList = new ArrayList<>(list);
    //把当前节点值加入到subList中
    subList.add(new Integer(root.val));
    //如果到达叶子节点，就不能往下走了，直接return
    if (root.left == null && root.right == null) {
        //如果到达叶子节点，并且sum等于叶子节点的值，说明我们找到了一组，
        //要把它放到result中
        if (sum == root.val)
            result.add(subList);
        //到叶子节点之后直接返回，因为在往下就走不动了
        return;
    }
    //如果没到达叶子节点，就继续从他的左右两个子节点往下找，注意到
    //下一步的时候，sum值要减去当前节点的值
    dfs(root.left, sum - root.val, subList, result);
    dfs(root.right, sum - root.val, subList, result);
}
```

### 3.3 [437. 路径总和 III](https://leetcode.cn/problems/path-sum-iii/)

给定一个二叉树的根节点 root ，和一个整数 targetSum ，求该二叉树里节点值之和等于 targetSum 的 **路径** 的数目。

```java
class Solution {
    public int pathSum(TreeNode root, int sum) {
        if(root == null) return 0;
        //因为未必是要从根节点开始，因此需要对所有节点进行递归判断
        return pathSumFromRoot(root,sum) + pathSum(root.left,sum) + pathSum(root.right,sum);
    }

    private int pathSumFromRoot(TreeNode root, int sum){ //递归判断从当前节点是否有满足条件的路径
        int ret = 0;
        if(root == null) return 0;
        if(sum == root.val) ret++;
        ret += pathSumFromRoot(root.left, sum - root.val) + pathSumFromRoot(root.right, sum - root.val);
        return ret;
    }
}
```

### 3.4 [572. 另一棵树的子树](https://leetcode.cn/problems/subtree-of-another-tree/)

给你两棵二叉树 root 和 subRoot 。检验 root 中是否包含和 subRoot 具有相同结构和节点值的子树。如果存在，返回 true ；否则，返回 false 。

```java
class Solution {
    public boolean isSubtree(TreeNode s, TreeNode t) {
        if(s == null) return false;
        //因为未必是要从根节点开始，因此需要对所有节点进行递归判断
        return isSubtree(s.left,t) || isSubtree(s.right,t) || isSubtreeFromRoot(s,t);
        
    }

    private boolean isSubtreeFromRoot(TreeNode s, TreeNode t){
        if(s == null && t == null) return true;
        if(s == null || t == null) return false;
        if(s.val != t.val) return false;
        return isSubtreeFromRoot(s.left,t.left) && isSubtreeFromRoot(s.right,t.right);
    }
}
```

### 3.5 [111. 二叉树的最小深度](https://leetcode.cn/problems/minimum-depth-of-binary-tree/)

给定一个二叉树，找出其最小深度。

```java
class Solution {
    public int minDepth(TreeNode root) {
        if(root == null) return 0;
        int left = minDepth(root.left);
        int right = minDepth(root.right);
        if(left == 0 || right == 0) return left+right+1;
        return Math.min(left , right) + 1;
    }
}
```

### 3.6 [101. 对称二叉树](https://leetcode.cn/problems/symmetric-tree/)

```java
class Solution {
    public boolean isSymmetric(TreeNode root) {
        return isMirror(root, root);
    }

    public boolean isMirror(TreeNode t1, TreeNode t2) {
        if (t1 == null && t2 == null) return true;
        if (t1 == null || t2 == null) return false;
        return 
            (t1.val == t2.val)
            && isMirror(t1.right, t2.left)
            && isMirror(t1.left, t2.right);
    }
}
```

### 3.7 [404. 左叶子之和](https://leetcode.cn/problems/sum-of-left-leaves/)

给定二叉树的根节点 root ，返回所有左叶子之和。

```java
//判断是不是左叶子
class Solution {
    public int sumOfLeftLeaves(TreeNode root) {
        if(root == null) return 0;
        int left = 0;
        if(isLeaf(root.left)){
            left = root.left.val;
        }
        return left + sumOfLeftLeaves(root.left) + sumOfLeftLeaves(root.right);
         
    }

    private boolean isLeaf(TreeNode root){ //判断是否是叶子节点
        if(root == null) return false;
        if(root.left == null && root.right == null) return true;
        return false;
    }
}
```

### 3.8 [687. 最长同值路径](https://leetcode.cn/problems/longest-univalue-path/)

给定一个二叉树的 root ，返回 *最长的路径的长度* ，这个路径中的 *每个节点具有相同值* 。

```java
class Solution {
    int res = 0;
    public int longestUnivaluePath(TreeNode root) {
        if (root == null) {
            return 0;
        }
        // 在后序遍历的位置更新 res
        maxLen(root, root.val);
        return res;
    }

    // 定义：计算以 root 为根的这棵二叉树中，从 root 开始值为 parentVal 的最长树枝长度
    private int maxLen(TreeNode root, int parentVal) {
        if (root == null) {
            return 0;
        }
        // 利用函数定义，计算左右子树值为 root.val 的最长树枝长度
        int leftLen = maxLen(root.left, root.val);
        int rightLen = maxLen(root.right, root.val);

        // 后序遍历位置顺便更新全局变量
        // 同值路径就是左右同值树枝长度之和
        res = Math.max(res, leftLen + rightLen);
        // 如果 root 本身和上级值不同，那么整棵子树都不可能有同值树枝
        if (root.val != parentVal) {
            return 0;
        }
        // 实现函数的定义：
        // 以 root 为根的二叉树从 root 开始值为 parentVal 的最长树枝长度
        // 等于左右子树的最长树枝长度的最大值加上 root 节点本身
        return  1 + Math.max(leftLen, rightLen);
    }
}
```

### 3.9 [337. 打家劫舍 III](https://leetcode.cn/problems/house-robber-iii/)

给定二叉树的 root 。返回 ***在不触动警报的情况下\*** *，小偷能够盗取的最高金额* 。

如果 两个直接相连的房子在同一天晚上被打劫 ，房屋将自动报警。

```java
class Solution {
    //设置备忘录，记录打劫该点的最大收益
    Map<TreeNode, Integer> memo = new HashMap<>();
    public int rob(TreeNode root) {
        if(root == null) return 0;
        // 移除子问题
        if(memo.containsKey(root)) {
            return memo.get(root);
        }

        int doRob = root.val
                + (root.left == null ?
                0 : rob(root.left.left) + rob(root.left.right))
                + (root.right == null ?
                0 : rob(root.right.left) + rob(root.right.right));

        int notRob = rob(root.left) + rob(root.right);
        int res = Math.max(doRob, notRob);
        memo.put(root, res);
        return res;
    }
}
```

### 3.10 [671. 二叉树中第二小的节点](https://leetcode.cn/problems/second-minimum-node-in-a-binary-tree/)

给定一个非空特殊的二叉树，每个节点都是正数，并且每个节点的子节点数量只能为 2 或 0。如果一个节点有两个子节点的话，那么这个节点的值不大于它的子节点的值。

```java
class Solution {
    public int findSecondMinimumValue(TreeNode root) {
        
        //递归中止条件
        if(root == null) return -1;  //如果为空节点，返回-1
        if(root.left == null && root.right == null) return -1;  //如果没有子节点，返回-1
        
        //递归操作
        int left = root.left.val;  //左节点的值
        int right = root.right.val;  //右节点的值
        if(root.val == left) left = findSecondMinimumValue(root.left);  //如果左节点和根节点的值相同，第二小的从左子树上寻找
        if(root.val == right) right = findSecondMinimumValue(root.right);  //如果和右节点还是相同，则找出右子树的第二小
        
       	//返回情况
        if(left != -1 && right != -1) return Math.min(left,right);  //如果左右都不是-1，返回其中的最小
        if(left == -1) return right;  //如果左边没有，那就返回右边
        return left;	//否则返回-1
    }
}
```

### 3.11 [110. 平衡二叉树](https://leetcode.cn/problems/balanced-binary-tree/)

```java
class Solution {
    public boolean isBalanced(TreeNode root) {
        maxDepth(root);
        return isBalanced;
    }

    // 记录二叉树是否平衡
    boolean isBalanced = true;

    // 输入一个节点，返回以该节点为根的二叉树的最大深度
    int maxDepth(TreeNode root) {
        if (root == null) {
            return 0;
        }
        int leftMaxDepth = maxDepth(root.left);
        int rightMaxDepth = maxDepth(root.right);

        // 后序遍历位置
        // 如果左右最大深度大于 1，就不是平衡二叉树
        if (Math.abs(rightMaxDepth - leftMaxDepth) > 1) {
            isBalanced = false;
        }

        return 1 + Math.max(leftMaxDepth, rightMaxDepth);
    }
}
```

### 3.12 [104. 二叉树的最大深度](https://leetcode.cn/problems/maximum-depth-of-binary-tree/)

二叉树的深度为根节点到最远叶子节点的最长路径上的节点数。

```java
class Solution {
        int depth = 0;
        int res = 0;
    public int maxDepth(TreeNode root) {
        traverse(root);
        return res;
    
    }
    void traverse(TreeNode root) {
        if (root == null) {
            return;
        }
    	// 前序遍历位置
        depth++;
        res = Math.max(res, depth);
        traverse(root.left);
        traverse(root.right);
        // 后序遍历位置
        depth--;
    }
}

class Solution2 {
    // 定义：输入一个节点，返回以该节点为根的二叉树的最大深度
    public int maxDepth(TreeNode root) {
        if (root == null) {
            return 0;
        }
        int leftMax = maxDepth(root.left);
        int rightMax = maxDepth(root.right);
        // 根据左右子树的最大深度推出原二叉树的最大深度
        return 1 + Math.max(leftMax, rightMax);
    }
}
```

### 3.13 [129. 求根节点到叶节点数字之和](https://leetcode.cn/problems/sum-root-to-leaf-numbers/)

```java
class Solution {
    StringBuilder path = new StringBuilder();
    int res = 0;

    public int sumNumbers(TreeNode root) {
        // 遍历一遍二叉树就能出结果
        traverse(root);
        return res;
    }

    // 二叉树遍历函数
    void traverse(TreeNode root) {
        if (root == null) {
            return;
        }
        // 前序遍历位置，记录节点值
        path.append(root.val);
        if (root.left == null && root.right == null) {
            // 到达叶子节点，累加路径和
            res += Integer.parseInt(path.toString());
        }
        // 二叉树递归框架，遍历左右子树
        traverse(root.left);
        traverse(root.right);

        // 后续遍历位置，撤销节点值
        path.deleteCharAt(path.length() - 1);

    }
}
```

### 3.14 [543. 二叉树的直径](https://leetcode.cn/problems/diameter-of-binary-tree/)

给定一棵二叉树，你需要计算它的直径长度。一棵二叉树的直径长度是任意两个结点路径长度中的最大值。

```java
class Solution {
    int maxDiameter = 0;

    public int diameterOfBinaryTree(TreeNode root) {
        maxDepth(root);
        return maxDiameter;
    }

    int maxDepth(TreeNode root) {
        if (root == null) {
            return 0;
        }
        int leftMax = maxDepth(root.left);
        int rightMax = maxDepth(root.right);
        // 后序遍历位置顺便计算最大直径
        maxDiameter = Math.max(maxDiameter, leftMax + rightMax);
        return 1 + Math.max(leftMax, rightMax);
    }
}
```

### 3.15 [226. 翻转二叉树](https://leetcode.cn/problems/invert-binary-tree/)

```java
// 「遍历」的思路
class Solution {
    // 主函数
    public TreeNode invertTree(TreeNode root) {
        // 遍历二叉树，交换每个节点的子节点
        traverse(root);
        return root;
    }

    // 二叉树遍历函数
    void traverse(TreeNode root) {
        if (root == null) {
            return;
        }

        /**** 前序位置 ****/
        // 每一个节点需要做的事就是交换它的左右子节点
        TreeNode tmp = root.left;
        root.left = root.right;
        root.right = tmp;

        // 遍历框架，去遍历左右子树的节点
        traverse(root.left);
        traverse(root.right);
    }
}

// 「分解问题」的思路
class Solution2 {
    // 定义：将以 root 为根的这棵二叉树翻转，返回翻转后的二叉树的根节点
    TreeNode invertTree(TreeNode root) {
        if (root == null) {
            return null;
        }
        // 利用函数定义，先翻转左右子树
        TreeNode left = invertTree(root.left);
        TreeNode right = invertTree(root.right);

        // 然后交换左右子节点
        root.left = right;
        root.right = left;

        // 和定义逻辑自恰：以 root 为根的这棵二叉树已经被翻转，返回 root
        return root;
    }
}
```

### 3.16 [863. 二叉树中所有距离为 K 的结点](https://leetcode.cn/problems/all-nodes-distance-k-in-binary-tree/)

给定一个二叉树（具有根结点 root）， 一个目标结点 target ，和一个整数值 k 。

返回到目标结点 target 距离为 k 的所有结点的值的列表。 答案可以以 任何顺序 返回。

```java
class Solution {
    // 记录父节点：node.val -> parentNode
    // 题目说了树中所有节点值都是唯一的，所以可以用 node.val 代表 TreeNode
    HashMap<Integer, TreeNode> parent = new HashMap<>();

    public List<Integer> distanceK(TreeNode root, TreeNode target, int k) {
        // 遍历所有节点，记录每个节点的父节点
        traverse(root, null);

        // 开始从 target 节点施放 BFS 算法，找到距离为 k 的节点
        Queue<TreeNode> q = new LinkedList<>();
        HashSet<Integer> visited = new HashSet<>();
        q.offer(target);
        visited.add(target.val);
        // 记录离 target 的距离
        int dist = 0;
        List<Integer> res = new LinkedList<>();

        while (!q.isEmpty()) {
            int sz = q.size();
            for (int i = 0; i < sz; i++) {
                TreeNode cur = q.poll();
                if (dist == k) {
                    // 找到距离起点 target 距离为 k 的节点
                    res.add(cur.val);
                }
                // 向父节点、左右子节点扩散
                TreeNode parentNode = parent.get(cur.val);
                if (parentNode != null && !visited.contains(parentNode.val)) {
                    visited.add(parentNode.val);
                    q.offer(parentNode);
                }
                if (cur.left != null && !visited.contains(cur.left.val)) {
                    visited.add(cur.left.val);
                    q.offer(cur.left);
                }
                if (cur.right != null && !visited.contains(cur.right.val)) {
                    visited.add(cur.right.val);
                    q.offer(cur.right);
                }
            }
            // 向外扩展一圈
            dist++;
        }

        return res;
    }

    private void traverse(TreeNode root, TreeNode parentNode) {
        if (root == null) {
            return;
        }
        parent.put(root.val, parentNode);
        // 二叉树递归框架
        traverse(root.left, root);
        traverse(root.right, root);
    }
}
```

### 3.17 [617. 合并二叉树](https://leetcode.cn/problems/merge-two-binary-trees/)

```java
class Solution {
    public TreeNode mergeTrees(TreeNode root1, TreeNode root2) {
        // 如果一棵树有，另一棵树没有，接上去
        if (root1 == null) {
            return root2;
        }
        if (root2 == null) {
            return root1;
        }
        // 两棵树都有的节点，叠加节点值
        root1.val += root2.val;
        // 递归合并左右子树
        root1.left = mergeTrees(root1.left, root2.left);
        root1.right = mergeTrees(root1.right, root2.right);

        return root1;
    }
}
```

## 4 二叉搜索树

对于 BST 的每一个节点 node，左子树节点的值都比 node 的值要小，右子树节点的值都比 node 的值大。

### 4.1 [98. 验证二叉搜索树](https://leetcode.cn/problems/validate-binary-search-tree/)

给你一个二叉树的根节点 root ，判断其是否是一个有效的二叉搜索树。

```java
class Solution {
    public boolean isValidBST(TreeNode root) {
        return isValidBST(root, null, null);
    }

    /* 限定以 root 为根的子树节点必须满足 max.val > root.val > min.val */
    boolean isValidBST(TreeNode root, TreeNode min, TreeNode max) {
        // base case
        if (root == null) return true;
        // 若 root.val 不符合 max 和 min 的限制，说明不是合法 BST
        if (min != null && root.val <= min.val) return false;
        if (max != null && root.val >= max.val) return false;
        // 限定左子树的最大值是 root.val，右子树的最小值是 root.val
        return isValidBST(root.left, min, root)
            && isValidBST(root.right, root, max);
    }
}
```



### 4.2 [230. 二叉搜索树中第K小的元素](https://leetcode.cn/problems/kth-smallest-element-in-a-bst/)

给定一个二叉搜索树的根节点 root ，和一个整数 k ，请你设计一个算法查找其中第 k 个最小元素（从 1 开始计数）。

```java
int kthSmallest(TreeNode root, int k) {
    // 利用 BST 的中序遍历特性
    traverse(root, k);
    return res;
}

// 记录结果
int res = 0;
// 记录当前元素的排名
int rank = 0;
void traverse(TreeNode root, int k) {
    if (root == null) {
        return;
    }
    traverse(root.left, k);
    /* 中序遍历代码位置 */
    rank++;
    if (k == rank) {
        // 找到第 k 小的元素
        res = root.val;
        return;
    }
    traverse(root.right, k);
}
```



### 4.3 [450. 删除二叉搜索树中的节点](https://leetcode.cn/problems/delete-node-in-a-bst/)

给定一个二叉搜索树的根节点 root 和一个值 key，删除二叉搜索树中的 key 对应的节点，并保证二叉搜索树的性质不变

```java
//三种情况：
//无左子：其右子顶替其位置，删除了该节点；
//无右子：其左子顶替其位置，删除了该节点；
//左右子节点都有：左子树转移到其右子树的最左节点的左子树上
//然后右子树顶替其位置，由此删除了该节点。
class Solution {
    public TreeNode deleteNode(TreeNode root, int key) {
        if (root == null) return null;
        if (root.val == key) {
            // 这两个 if 把情况 1 和 2 都正确处理了
            if (root.left == null) return root.right;
            if (root.right == null) return root.left;
            // 处理情况 3
            // 获得右子树最小的节点
            TreeNode minNode = getMin(root.right);
            // 删除右子树最小的节点
            root.right = deleteNode(root.right, minNode.val);
            // 用右子树最小的节点替换 root 节点
            minNode.left = root.left;
            minNode.right = root.right;
            root = minNode;
        } else if (root.val > key) {
            root.left = deleteNode(root.left, key);
        } else if (root.val < key) {
            root.right = deleteNode(root.right, key);
        }
        return root;
    }

    TreeNode getMin(TreeNode node) {
        // BST 最左边的就是最小的
        while (node.left != null) node = node.left;
        return node;
    }
}
```

### 4.4 [96. 不同的二叉搜索树](https://leetcode.cn/problems/unique-binary-search-trees/)

给你一个整数 n ，求恰由 n 个节点组成且节点值从 1 到 n 互不相同的 二叉搜索树 有多少种

```java
class Solution {
    // 备忘录
    int[][] memo;

    int numTrees(int n) {
        // 备忘录的值初始化为 0
        memo = new int[n + 1][n + 1];
        return count(1, n);
    }

    int count(int lo, int hi) {
        if (lo > hi) return 1;
        // 查备忘录
        if (memo[lo][hi] != 0) {
            return memo[lo][hi];
        }

        int res = 0;
        for (int mid = lo; mid <= hi; mid++) {
            int left = count(lo, mid - 1);
            int right = count(mid + 1, hi);
            res += left * right;
        }
        // 将结果存入备忘录
        memo[lo][hi] = res;

        return res;
    }
}
```

### 4.5 [108. 将有序数组转换为二叉搜索树](https://leetcode.cn/problems/convert-sorted-array-to-binary-search-tree/)

给你一个整数数组 nums ，其中元素已经按 升序 排列，请你将其转换为一棵 高度平衡 二叉搜索树。

```java
class Solution {
    public TreeNode sortedArrayToBST(int[] nums) {
        return build(nums, 0, nums.length - 1);
    }

    // 将闭区间 [left, right] 中的元素转化成 BST，返回根节点
    TreeNode build(int[] nums, int left, int right) {
        if (left > right) {
            // 区间为空
            return null;
        }
        // 构造根节点
        // BST 节点左小右大，中间的元素就是根节点
        int mid = (left + right) / 2;
        TreeNode root = new TreeNode(nums[mid]);
        // 递归构建左子树
        root.left = build(nums, left, mid - 1);
        // 递归构造右子树
        root.right = build(nums, mid + 1, right);

        return root;
    }
}
```

### 4.6 [449. 序列化和反序列化二叉搜索树](https://leetcode.cn/problems/serialize-and-deserialize-bst/)

```java
public class Codec {
    // 分隔符，区分每个节点的值
    private final static String SEP = ",";

    // Encodes a tree to a single string.
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        serialize(root, sb);
        return sb.toString();
    }

    private void serialize(TreeNode root, StringBuilder sb) {
        if (root == null) {
            return;
        }
        // 前序遍历位置进行序列化
        sb.append(root.val).append(SEP);
        serialize(root.left, sb);
        serialize(root.right, sb);
    }

    // Decodes your encoded data to tree.
    public TreeNode deserialize(String data) {
        if (data.isEmpty()) return null;
        // 转化成前序遍历结果
        LinkedList<Integer> inorder = new LinkedList<>();
        for (String s : data.split(SEP)) {
            inorder.offer(Integer.parseInt(s));
        }
        return deserialize(inorder, Integer.MIN_VALUE, Integer.MAX_VALUE);
    }

    // 定义：将 nodes 中值在闭区间 [min, max] 的节点构造成一棵 BST
    private TreeNode deserialize(LinkedList<Integer> nodes, int min, int max) {
        if (nodes.isEmpty()) return null;
        // 前序遍历位置进行反序列化
        // 前序遍历结果第一个节点是根节点
        int rootVal = nodes.getFirst();
        if (rootVal > max || rootVal < min) {
            // 超过闭区间 [min, max]，则返回空指针
            return null;
        }
        nodes.removeFirst();
        // 生成 root 节点
        TreeNode root = new TreeNode(rootVal);
        // 构建左右子树
        // BST 左子树都比根节点小，右子树都比根节点大
        root.left = deserialize(nodes, min, rootVal);
        root.right = deserialize(nodes, rootVal, max);
        return root;
    }
}
```

### 4.7 [669. 修剪二叉搜索树](https://leetcode.cn/problems/trim-a-binary-search-tree/)

给你二叉搜索树的根节点 root ，同时给定最小边界low 和最大边界 high。通过修剪二叉搜索树，使得所有节点的值在[low, high]中。

```java
// 根据二叉搜索树的性质
// 一个节点小于 low，则左子树都要减掉
// 同样的处理大于情况
class Solution {
    // 定义：删除 BST 中小于 low 和大于 high 的所有节点，返回结果 BST
    public TreeNode trimBST(TreeNode root, int low, int high) {
        if (root == null) return null;

        if (root.val < low) {
            // 直接返回 root.right
            // 等于删除 root 以及 root 的左子树
            return trimBST(root.right, low, high);
        }
        if (root.val > high) {
            // 直接返回 root.left
            // 等于删除 root 以及 root 的右子树
            return trimBST(root.left, low, high);
        }

        // 闭区间 [lo, hi] 内，不处理当前节点，递归子树
        root.left = trimBST(root.left, low, high);
        root.right = trimBST(root.right, low, high);
        return root;
    }
}
```

### 4.8 [173. 二叉搜索树迭代器](https://leetcode.cn/problems/binary-search-tree-iterator/)

实现一个二叉搜索树迭代器类BSTIterator ，表示一个按中序遍历二叉搜索树（BST）的迭代器：

```java
class BSTIterator {
    // 模拟递归栈
    private Stack<TreeNode> stk = new Stack<>();

    // 一路到底，把根节点和它的所有左节点放到栈中；
    private void pushLeftBranch(TreeNode p) {
        while (p != null) {
            stk.push(p);
            p = p.left;
        }
    }

    public BSTIterator(TreeNode root) {
        pushLeftBranch(root);
    }
    
	// 弹出栈顶节点
    public int next() {
        TreeNode p = stk.pop();
        pushLeftBranch(p.right);
        return p.val;
    }

    public boolean hasNext() {
        return !stk.isEmpty();
    }
}
```

### 4.9 [1305. 两棵二叉搜索树中的所有元素](https://leetcode.cn/problems/all-elements-in-two-binary-search-trees/)

给你 root1 和 root2 这两棵二叉搜索树。请你返回一个列表，其中包含 两棵树 中的所有整数并按 升序 排序。

```java
class Solution {
    public List<Integer> getAllElements(TreeNode root1, TreeNode root2) {
        // BST 有序迭代器
        BSTIterator t1 = new BSTIterator(root1);
        BSTIterator t2 = new BSTIterator(root2);
        LinkedList<Integer> res = new LinkedList<>();
        // 类似合并有序链表的算法逻辑
        while (t1.hasNext() && t2.hasNext()) {
            if (t1.peek() > t2.peek()) {
                res.add(t2.next());
            } else {
                res.add(t1.next());
            }
        }
        // 如果有一棵 BST 还剩元素，添加到最后
        while (t1.hasNext()) {
            res.add(t1.next());
        }
        while (t2.hasNext()) {
            res.add(t2.next());
        }
        return res;
    }

}

// BST 有序迭代器
class BSTIterator {
    Stack<TreeNode> stk = new Stack<>();
    // 左侧树枝一撸到底
    private void pushLeftBranch(TreeNode p) {
        while (p != null) {
            stk.push(p);
            p = p.left;
        }
    }

    public BSTIterator(TreeNode root) {
        pushLeftBranch(root);
    }

    public int peek() {
        return stk.peek().val;
    }

    public int next() {
        TreeNode p = stk.pop();
        pushLeftBranch(p.right);
        return p.val;
    }

    public boolean hasNext() {
        return !stk.isEmpty();
    }
}
```

### 4.10 [1038. 从二叉搜索树到更大和树](https://leetcode.cn/problems/binary-search-tree-to-greater-sum-tree/)

给定一个二叉搜索树 root (BST)，请将它的每个节点的值替换成树中大于或者等于该节点值的所有节点值之和。

```java
class Solution {
    public TreeNode bstToGst(TreeNode root) {
        traverse(root);
        return root;
    }

    // 记录累加和
    int sum = 0;
    void traverse(TreeNode root) {
        if (root == null) {
            return;
        }
        traverse(root.right);
        // 维护累加和
        sum += root.val;
        // 将 BST 转化成累加树
        root.val = sum;
        traverse(root.left);
    }
}
```

### 4.11 [1373. 二叉搜索子树的最大键值和](https://leetcode.cn/problems/maximum-sum-bst-in-binary-tree/)

```java
1、左右子树是否是 BST。

2、左子树的最大值和右子树的最小值。

3、左右子树的节点值之和。

想要获得子树的信息，就要用到前文 手把手刷二叉树总结篇 说过的后序位置的妙用了。

我们定义一个 traverse 函数，traverse(root) 返回一个大小为 4 的 int 数组，我们暂且称它为 res，其中：

res[0] 记录以 root 为根的二叉树是否是 BST，若为 1 则说明是 BST，若为 0 则说明不是 BST；

res[1] 记录以 root 为根的二叉树所有节点中的最小值；

res[2] 记录以 root 为根的二叉树所有节点中的最大值；

res[3] 记录以 root 为根的二叉树所有节点值之和。
class Solution {
    // 全局变量，记录 BST 最大节点之和
    int maxSum = 0;

    /* 主函数 */
    public int maxSumBST(TreeNode root) {
        traverse(root);
        return maxSum;
    }

    int[] traverse(TreeNode root) {
        // base case
        if (root == null) {
            return new int[] {
                    1, Integer.MAX_VALUE, Integer.MIN_VALUE, 0
            };
        }

        // 递归计算左右子树
        int[] left = traverse(root.left);
        int[] right = traverse(root.right);

        /*******后序遍历位置*******/
        int[] res = new int[4];
        // 这个 if 在判断以 root 为根的二叉树是不是 BST
        if (left[0] == 1 && right[0] == 1 &&
                root.val > left[2] && root.val < right[1]) {
            // 以 root 为根的二叉树是 BST
            res[0] = 1;
            // 计算以 root 为根的这棵 BST 的最小值
            res[1] = Math.min(left[1], root.val);
            // 计算以 root 为根的这棵 BST 的最大值
            res[2] = Math.max(right[2], root.val);
            // 计算以 root 为根的这棵 BST 所有节点之和
            res[3] = left[3] + right[3] + root.val;
            // 更新全局变量
            maxSum = Math.max(maxSum, res[3]);
        } else {
            // 以 root 为根的二叉树不是 BST
            res[0] = 0;
            // 其他的值都没必要计算了，因为用不到
        }
        /**************************/

        return res;
    }
}
```



### 4.12 [面试题 04.06. 后继者](https://leetcode.cn/problems/successor-lcci/)

找出二叉搜索树中指定节点的“下一个”节点（也即中序后继）。

- 若有 root.val <= p.val : 根据 BST 特性可知当前节点 root 及其左子树子节点均满足「值小于等于 p.val」，因此不可能是 p 点的后继，我们直接到 root 的右子树搜索 p 的后继（递归处理）；
- 若有 root.val > p.val : 当第一次搜索到满足此条件的节点时，在以 root 为根节点的子树中「位于最左下方」的值为 p 的后继，但也有可能 root 没有左子树，因此 p 的后继要么在 root 的左子树中（若有），要么是 root 本身，此时我们可以直接到 root 的左子树搜索，若搜索结果为空返回 root，否则返回搜索结果。

```java
class Solution {
    public TreeNode inorderSuccessor(TreeNode root, TreeNode p) {
        if (root == null) return null;
        if (root.val <= p.val) return inorderSuccessor(root.right, p);
        TreeNode ans = inorderSuccessor(root.left, p);
        return ans == null ? root : ans;
    }
}
```

### 4.13 [109. 有序链表转换二叉搜索树](https://leetcode.cn/problems/convert-sorted-list-to-binary-search-tree/)

给定一个单链表的头节点  head ，其中的元素 按升序排序 ，将其转换为高度平衡的二叉搜索树。

```java
// 使用快慢指针寻找中间值（需要找到中间节点的前一个节点）
class Solution {
    public TreeNode sortedListToBST(ListNode head) {
        //有下面两种边界问题
        if(head == null) return null;
        if(head.next == null) return new TreeNode(head.val);
        ListNode preMid = helper(head);
        ListNode mid = preMid.next;
        preMid.next = null;//从这里断开链表
        TreeNode root = new TreeNode(mid.val);
        root.left = sortedListToBST(head);
        root.right = sortedListToBST(mid.next);
        return root;
    }
        //寻找preMid
    ListNode helper(ListNode head){
        ListNode slow = head;
        ListNode fast = head.next.next;
        while(fast != null && fast.next != null){
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;
    }
}
```





### 4.14 剑指26.二叉搜索树与双向链表

输入一棵二叉搜索树，将该二叉搜索树转换成一个排序的双向链表。要求不能创建任何新的结点，只能调整树中结点指针的指向。

思路：

线索化二叉树。类似于中序遍历构建。

由于正向构建时，指针会移动到尾部，因此反向构建。

```java
public class Solution {
    TreeNode pre = null;
    public TreeNode Convert(TreeNode pRootOfTree) {
        if(pRootOfTree == null) return null;
        Convert(pRootOfTree.right);
        if(pre!=null){
            pRootOfTree.right = pre;
            pre.left = pRootOfTree;
        }
        pre = pRootOfTree;
        Convert(pRootOfTree.left);
        return pre;
    }
}
```

### 4.15 653.给定一个二叉搜索树和一个目标结果，如果 BST 中存在两个元素且它们的和等于给定的目标结果，则返回 true。

```java
class Solution {
    public boolean findTarget(TreeNode root, int k) {
        List<Integer> inOrder = new ArrayList<>();
        inOrder(root, inOrder);
        int left = 0, right = inOrder.size() - 1;
        while(left < right){
            int sum = inOrder.get(left) + inOrder.get(right);
            if(sum == k) return true;
            else if(sum > k) right--;
            else left ++;
        }
        return false;
    }

    void inOrder(TreeNode root, List<Integer> inOrder){
        if(root == null) return;
        inOrder(root.left, inOrder);
        inOrder.add(root.val);
        inOrder(root.right, inOrder);
    }
}
```

### 4.16 501.给定一个有相同值的二叉搜索树（BST），找出 BST 中的所有众数（出现频率最高的元素）。

如果众数超过1个，不需考虑输出顺序。

你可以不使用额外的空间吗？（假设由递归产生的隐式调用栈的开销不被计算在内）

思路：

毫无疑问，同样使用中序遍历。

```java
class Solution {

    int min = Integer.MAX_VALUE;//存储最小值
    TreeNode preNode = null;//存储前一个结点

    public int getMinimumDifference(TreeNode root) {
        inOrder(root);
        return min;
    }

    void inOrder(TreeNode root){
        if(root == null) return;
        inOrder(root.left);
        int cur = root.val;
        if(preNode != null)
            //后一个节点肯定大于前一个节点
            min = Math.min(cur - preNode.val, min);
        preNode = root;
        inOrder(root.right);
    }
}
```