insert into system_settings (id, franchise_fee_rate, default_gst_rate)
values (true, 0.08, 0.15)
on conflict (id) do update set franchise_fee_rate = excluded.franchise_fee_rate;

insert into agents (name, withholding_tax_rate, gst_rate, residential_agent_split, residential_company_split, commercial_lease_agent_split, commercial_lease_company_split)
values
('Jallon Wang', 0.2, 0.15, 0.55, 0.45, 0.5, 0.5),
('Prem Nath', 0, 0.15, 0.65, 0.35, 0.5, 0.5),
('Alan Cai', 0.2, 0.15, 0.7, 0.3, 0.7, 0.3),
('Addy Sehdev', 0.2, 0.15, 0.6, 0.4, 0.5, 0.5),
('Martin Ma', 0, 0.15, 0.7, 0.3, 0.5, 0.5),
('Nigel Shi', 0.2, 0, 0.7, 0.3, 0.5, 0.5),
('Miro Wang', 0.2, 0.15, 0.7, 0.3, 0.5, 0.5),
('Alana Sun', 0.2, 0.15, 0.7, 0.3, 0.5, 0.5),
('Tongtong Xie', 0.1, 0.15, 0.7, 0.3, 0.5, 0.5),
('Rita Liu', 0.2, 0, 0.7, 0.3, 0.5, 0.5),
('Joanna Xu (EGEO LIMITED)', 0, 0.15, 0.7, 0.3, 0.5, 0.5),
('Swapnil Gaonkar', 0.2, 0, 0.7, 0.3, 0.5, 0.5),
('Jackson Lieu', 0.2, 0, 0.55, 0.45, 0.5, 0.5),
('Angela Zhang', 0.2, 0.15, 0.7, 0.3, 0.5, 0.5),
('Tamina Zhang', 0.2, 0.15, 0.7, 0.3, 0.5, 0.5)
on conflict (name) do update set
withholding_tax_rate = excluded.withholding_tax_rate,
gst_rate = excluded.gst_rate,
residential_agent_split = excluded.residential_agent_split,
residential_company_split = excluded.residential_company_split;
