# kube-cluster-dwk

Decided to do the GitOps exercises in an individual repo to avoid clutter / general shitstorm mayhem.
Atleast it works. 

Had to create the cluster with:
```
k3d cluster create --port '8082:30080@agent[0]' -p 8081:80@loadbalancer --agents 2
```
because of how frontend/backend communication works on application level. Shouldn't be a problem though?
