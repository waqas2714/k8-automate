#!/bin/bash
sudo apt update -y && sudo apt upgrade -y
sudo apt install -y apt-transport-https curl
sudo apt install -y containerd
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml > /dev/null
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sudo systemctl restart containerd
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt update -y
sudo apt install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab
sudo modprobe overlay
sudo modprobe br_netfilter
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf > /dev/null
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sudo sysctl --system
sudo kubeadm init --pod-network-cidr=10.244.0.0/16 --ignore-preflight-errors=all | tee kubeadm-init-output.txt
grep -A 2 'kubeadm join' kubeadm-init-output.txt > worker-join-cmd
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown ubuntu:ubuntu $HOME/.kube/config
sudo chmod 644 $HOME/.kube/config
echo 'export KUBECONFIG=/.kube/config' >> /home/ubuntu/.bashrc
curl -LO https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
kubectl apply -f kube-flannel.yml
sudo cp /worker-join-cmd /home/ubuntu/
kubectl create clusterrolebinding node-admin-binding \
  --clusterrole=cluster-admin \
  --group=system:nodes