/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { Globe, MapPin, RefreshCw, Clock, ArrowRightLeft } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { manualCrawlAction } from "@/lib/actions/crawl";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function GoldTracker() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/prices/history");
      const history = await res.json();
      if (Array.isArray(history)) {
        setData(history);
      } else {
        console.error("API Error:", history.error);
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualUpdate = async () => {
    setRefreshing(true);
    try {
      const result = await manualCrawlAction();
      if (result.success) {
        await fetchData();
      } else {
        alert("Failed to update: " + result.error);
      }
    } catch (error) {
      console.error("Manual update error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const latest = data[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <RefreshCw className="w-16 h-16 text-yellow-500/20 animate-spin" />
            <RefreshCw className="w-16 h-16 text-yellow-500 absolute top-0 left-0 animate-spin blur-sm opacity-50" />
          </div>
          <p className="text-xl font-light tracking-widest text-slate-500 uppercase">Đang đồng bộ thị trường</p>
        </div>
      </div>
    );
  }

  const chartData = [...data].reverse().map((item) => {
    const gold990 = item.local_all?.find((g: any) => g.name === "Vàng Ta 990");
    return {
      time: format(new Date(item.timestamp), "HH:mm"),
      buy: item.local.buy,
      sell: item.local.sell,
      buy990: gold990?.buy,
      sell990: gold990?.sell,
      worldVnd: item.world.vnd_per_chi,
      worldUsd: item.world.usd_per_oz,
    };
  });

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 p-4 md:p-12 font-sans selection:bg-yellow-500/30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-2 text-center md:text-left items-center md:items-start">
          <div className="space-y-2 flex flex-col items-center md:items-start w-full md:w-auto">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-emerald-500 uppercase">
                Thị trường trực tiếp
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
              Giá <span className="text-yellow-500 font-black">Vàng</span>
            </h1>
            <p className="text-slate-500 text-sm md:text-lg font-light flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              Cập nhật {latest ? format(new Date(latest.timestamp), "HH:mm, dd/MM") : "ngay bây giờ"}
            </p>
          </div>

          <div className="flex items-center justify-center md:justify-end w-full md:w-auto">
            <Button
              onClick={handleManualUpdate}
              disabled={refreshing}
              size="lg"
              className="rounded-full px-8 py-6 font-bold uppercase tracking-widest text-[10px] md:text-xs h-auto w-full md:w-auto shadow-[0_10px_30px_rgba(255,255,255,0.05)]"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
              Cập nhật ngay
            </Button>
          </div>
        </header>

        {/* Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-16 md:mb-20 px-1 md:px-2">
          {/* Main Card */}
          <Card className="lg:col-span-8 bg-slate-900/20 border-white/5 rounded-[32px] md:rounded-[40px] p-1 flex flex-col justify-between group hover:border-white/10 transition-colors">
            <CardHeader className="p-6 md:p-10 pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                    {latest?.local?.name}
                  </CardDescription>
                  <CardTitle className="text-3xl md:text-4xl font-medium text-white">Ngọc Thẩm</CardTitle>
                </div>
                <div className="p-4 bg-yellow-500/10 rounded-2xl">
                  <MapPin className="w-4 h-4 md:w-8 md:h-8 text-yellow-500" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 md:p-10 pt-0">
              <div className="space-y-6 md:space-y-8 mt-4 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-end justify-center md:justify-start gap-1 md:gap-6">
                  <span className="text-5xl md:text-9xl font-black text-white tracking-tighter leading-none">
                    {latest?.local?.sell?.toLocaleString()}
                  </span>
                  <span className="text-base md:text-xl text-slate-500 font-medium mb-1 md:mb-2 uppercase tracking-tight">
                    VND / Chỉ
                  </span>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="bg-white/5 border border-white/5 rounded-2xl px-6 py-4 flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Giá Mua</span>
                    <span className="text-lg font-bold text-slate-200">{latest?.local?.buy?.toLocaleString()}</span>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-6 py-4 flex flex-col">
                    <span className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mb-1">
                      Chênh lệch
                    </span>
                    <span className="text-lg font-bold text-emerald-500">
                      {(latest?.local?.sell - latest?.local?.buy).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Stats */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <StatCard
              title="Giá Thế Giới"
              value={latest?.world?.usd_per_oz}
              subtext={`${latest?.world?.vnd_per_chi?.toLocaleString()} VND / Chỉ (Quy đổi)`}
              icon={<Globe className="w-5 h-5 text-blue-500" />}
              unit="USD"
            />
            <StatCard
              title="Chênh lệch"
              value={latest?.diff}
              subtext="Trong nước vs Thế giới"
              icon={<ArrowRightLeft className="w-5 h-5 text-purple-500" />}
              unit="VND"
              variant="highlight"
            />
          </div>
        </div>

        {/* Charts and Tables Section */}
        <Tabs defaultValue="table" className="space-y-12 mb-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">Thống kê giá vàng</h2>
            <TabsList className="bg-slate-900/50 border border-white/5 rounded-full p-1 h-12">
              <TabsTrigger
                value="table"
                className="rounded-full px-8 h-full data-[state=active]:bg-white data-[state=active]:text-black transition-all"
              >
                CHI TIẾT
              </TabsTrigger>
              <TabsTrigger
                value="chart"
                className="rounded-full px-8 h-full data-[state=active]:bg-white data-[state=active]:text-black transition-all"
              >
                XU HƯỚNG
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="table" className="mt-0 outline-none">
            <div className="text-xl md:text-3xl mb-3 font-bold tracking-tight text-white">Vàng Ngọc Thẩm</div>
            <div className="text-sm md:text-base mb-3 font-bold tracking-tight text-white">
              Cập nhật lần cuối: {latest?.localLastUpdate ? new Date(latest.localLastUpdate).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : "N/A"}
            </div>
            <Card className="bg-slate-900/20 border-white/5 rounded-[32px] md:rounded-[40px] overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-[500px] md:min-w-full">
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="px-6 md:px-8 py-4 md:py-6 text-[10px] font-bold uppercase tracking-widest text-slate-500 h-auto">
                        Loại Vàng
                      </TableHead>
                      <TableHead className="px-6 md:px-8 py-4 md:py-6 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right h-auto">
                        Giá Mua
                      </TableHead>
                      <TableHead className="px-6 md:px-8 py-4 md:py-6 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right h-auto">
                        Giá Bán
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(latest?.local_all || [latest?.local]).map((item: any, idx: number) => (
                      <TableRow key={idx} className="border-white/5 group hover:bg-white/[0.02] transition-colors">
                        <TableCell className="px-6 md:px-8 py-4 md:py-6 font-medium text-slate-300 group-hover:text-white">
                          {item.name}
                        </TableCell>
                        <TableCell className="px-6 md:px-8 py-4 md:py-6 font-bold text-right text-slate-400">
                          {item.buy.toLocaleString()}
                        </TableCell>
                        <TableCell className="px-6 md:px-8 py-4 md:py-6 font-black text-right text-yellow-500/80 group-hover:text-yellow-500">
                          {item.sell.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="chart" className="space-y-6 md:space-y-8 mt-0 outline-none">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
              {/* Local Chart (Combined 99.99 & 990) */}
              <Card className="bg-slate-900/20 border-white/5 rounded-[32px] md:rounded-[40px] p-4 md:p-8 overflow-hidden h-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-10">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white tracking-tight">Giá Vàng Trong Nước</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase whitespace-nowrap">99.99 Bán</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full border-2 border-dashed border-emerald-500" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase whitespace-nowrap">99.99 Mua</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase whitespace-nowrap">990 Bán</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full border-2 border-dashed border-orange-500" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase whitespace-nowrap">990 Mua</span>
                    </div>
                  </div>
                </div>

                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorLocal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.05} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="time" stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis
                        domain={["auto", "auto"]}
                        stroke="#444"
                        fontSize={10}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`}
                      />
                      <Tooltip
                        formatter={(value: any) => [`${Number(value).toLocaleString()} VNĐ`]}
                        contentStyle={{
                          backgroundColor: "#000",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "16px",
                        }}
                        itemStyle={{ fontSize: "12px" }}
                      />
                      {/* 99.99 Lines (Emerald) */}
                      <Area
                        type="monotone"
                        dataKey="sell"
                        name="Bán ra 99.99"
                        stroke="#10b981"
                        strokeWidth={4}
                        fill="url(#colorLocal)"
                        animationDuration={1500}
                      />
                      <Area
                        type="monotone"
                        dataKey="buy"
                        name="Mua vào 99.99"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="transparent"
                        animationDuration={1500}
                      />
                      {/* 990 Lines (Orange) */}
                      <Area
                        type="monotone"
                        dataKey="sell990"
                        name="Bán ra 990"
                        stroke="#f97316"
                        strokeWidth={3}
                        fill="transparent"
                        animationDuration={1500}
                      />
                      <Area
                        type="monotone"
                        dataKey="buy990"
                        name="Mua vào 990"
                        stroke="#f97316"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="transparent"
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* World Chart */}
              <Card className="bg-slate-900/20 border-white/5 rounded-[40px] p-8 overflow-hidden h-auto">
                <div className="flex items-center justify-between mb-10">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white tracking-tight">Giá Vàng Thế Giới</h3>
                    <p className="text-sm text-slate-500">Đơn vị USD / oz (Hợp đồng tương lai)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Spot</span>
                  </div>
                </div>

                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorWorldUsd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="time" stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis
                        domain={["auto", "auto"]}
                        stroke="#444"
                        fontSize={10}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `$${val.toLocaleString()}`}
                      />
                      <Tooltip
                        formatter={(value: any) => [`$${Number(value).toLocaleString()}`]}
                        contentStyle={{
                          backgroundColor: "#000",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "16px",
                        }}
                        itemStyle={{ color: "#fff", fontSize: "12px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="worldUsd"
                        name="Giá Thế Giới (USD)"
                        stroke="#3b82f6"
                        strokeWidth={4}
                        fill="url(#colorWorldUsd)"
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <footer className="py-12 border-t border-white/5 text-center text-slate-600">
          <p className="text-xs font-bold tracking-[0.3em] uppercase">
            © 2026 HỆ THỐNG GIÁ VÀNG TRỰC TUYẾN • CUNG CẤP BỞI NTJ DATA
          </p>
        </footer>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtext, icon, unit, variant = "default" }: any) {
  return (
    <Card
      className={cn(
        "flex-1 border-white/5 bg-slate-900/20 rounded-[24px] md:rounded-[32px] p-6 md:p-8 flex flex-col justify-between group transition-all duration-500 ease-out hover:-translate-y-1 hover:border-white/10",
        variant === "highlight" &&
          "bg-purple-600/5 border-purple-500/20 hover:border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.1)]",
      )}
    >
      <CardHeader className="p-0 flex flex-row items-center justify-between mb-6">
        <CardDescription
          className={cn(
            "text-[10px] font-bold uppercase tracking-widest text-slate-500",
            variant === "highlight" && "text-purple-500/70",
          )}
        >
          {title}
        </CardDescription>
        <div
          className={cn(
            "p-2 rounded-xl transition-colors",
            variant === "highlight" ? "bg-purple-500/10" : "bg-slate-800",
          )}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-white">{value?.toLocaleString()}</span>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{unit}</span>
        </div>
        <p className={cn("text-xs mt-1", variant === "highlight" ? "text-purple-500/70" : "text-slate-600")}>
          {subtext}
        </p>
      </CardContent>
    </Card>
  );
}
